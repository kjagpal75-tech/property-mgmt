const express = require('express');
const cors = require('cors');
const db = require('./db');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Authentication configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Debug utility
const debug = {
  log: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  }
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true // Allow cookies/authorization headers
}));
app.use(express.json());

// Add market_value column to properties table if it doesn't exist
db.query(`
  ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS market_value DECIMAL(12,2)
`).catch(err => {
  if (err) {
    console.error('Error adding market_value column:', err);
  } else {
    console.log('✅ market_value column ensured in properties table');
  }
});

// Properties endpoints
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    // First get all properties
    const propertiesResult = await db.query('SELECT * FROM properties ORDER BY created_at DESC');
    
    // Then get rent history for each property and add it
    const propertiesWithHistory = await Promise.all(
      propertiesResult.rows.map(async (property) => {
        const rentHistoryResult = await db.query(
          'SELECT id, monthly_rate, effective_date, end_date, reason, created_at FROM rental_rate_history WHERE property_id = $1 ORDER BY effective_date DESC',
          [property.id]
        );
        
        const propertyData = {
          id: property.id,
          name: property.name,
          address: property.address,
          purchasePrice: parseFloat(property.purchase_price) || 0,
          marketValue: property.market_value ? parseFloat(property.market_value) : undefined,
          redfinUrl: property.redfin_url,
          redfinMarketValue: property.redfin_market_value ? parseFloat(property.redfin_market_value) : null,
          monthlyRent: parseFloat(property.monthly_rent) || 0,
          currentRent: parseFloat(property.current_rent) || 0,
          leaseStartDate: property.lease_start_date ? new Date(property.lease_start_date) : undefined,
          createdAt: new Date(property.created_at),
          updatedAt: new Date(property.updated_at),
          rent_history: rentHistoryResult.rows
        };
        console.log('Server returning property:', { id: property.id, name: property.name, redfinUrl: propertyData.redfinUrl });
        return propertyData;
      })
    );
    
    res.json(propertiesWithHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update property market value
app.put('/api/properties/:id/market-value', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { market_value } = req.body;
    console.log('Updating market value for property:', { id, market_value });
    
    const result = await db.query(
      'UPDATE properties SET market_value = $1 WHERE id = $2 RETURNING *',
      [market_value, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/properties', authenticateToken, async (req, res) => {
  try {
    const { name, address, purchase_price, monthly_rent, lease_start_date } = req.body;
    const id = uuidv4();
    const result = await db.query(
      'INSERT INTO properties (id, name, address, purchase_price, monthly_rent, lease_start_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, address, purchase_price, monthly_rent, lease_start_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, purchase_price, monthly_rent, lease_start_date } = req.body;
    console.log('🏠 Updating property:', { id, name, address, purchase_price, monthly_rent, lease_start_date });
    
    const result = await db.query(
      'UPDATE properties SET name = $1, address = $2, purchase_price = $3, monthly_rent = $4, lease_start_date = $5 WHERE id = $6 RETURNING *',
      [name, address, purchase_price, monthly_rent, lease_start_date, id]
    );
    
    console.log('✅ Property updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating property:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM properties WHERE id = $1', [id]);
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PDF text extraction endpoint
app.post('/api/extract-pdf-text', async (req, res) => {
  try {
    console.log('=== PDF Text Extraction Request ===');
    console.log('Request headers:', req.headers);
    
    if (!req.body || !req.body.pdfData) {
      return res.status(400).json({ error: 'PDF data is required' });
    }
    
    const { extractPDFText } = require('./pdf-extractor');
    
    // Convert base64 back to buffer
    const pdfBuffer = Buffer.from(req.body.pdfData, 'base64');
    console.log('PDF buffer size:', pdfBuffer.length);
    
    // Extract text from PDF
    const extractedData = await extractPDFText(pdfBuffer);
    
    console.log('Extracted PDF data:', {
      pages: extractedData.pages,
      textLength: extractedData.text.length,
      hasText: extractedData.text.length > 0
    });
    
    res.json({
      success: true,
      text: extractedData.text,
      pages: extractedData.pages,
      info: extractedData.info,
      metadata: extractedData.metadata
    });
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ error: 'Failed to extract text from PDF' });
  }
});

// Transactions endpoints
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, p.name as property_name 
      FROM transactions t 
      LEFT JOIN properties p ON t.property_id = p.id 
      ORDER BY t.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { property_id, type, category, amount, description, date } = req.body;
    console.log('Received transaction data:', req.body);
    
    const id = uuidv4();
    console.log('Generated ID:', id);
    
    // Convert amount to number to ensure proper type
    const numericAmount = parseFloat(amount.toString());
    console.log('Numeric amount:', numericAmount);
    
    const query = 'INSERT INTO transactions (id, property_id, type, category, amount, description, date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, property_id, type, category, amount, description, date, created_at';
    const values = [id, property_id, type, category, numericAmount, description, date];
    
    console.log('DEBUG - Values array:');
    console.log('id:', id);
    console.log('property_id:', property_id);
    console.log('type:', type);
    console.log('category:', category);
    console.log('numericAmount:', numericAmount);
    console.log('description:', description);
    console.log('date:', date);
    console.log('Final values array:', values);
    
    console.log('SQL Query:', query);
    console.log('Query length:', query.length);
    console.log('Query chars:', query.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`));
    console.log('SQL Values:', values);
    
    const result = await db.query(query, values);
    console.log('Query result:', result);
    console.log('Result rows:', result.rows);
    console.log('Result row count:', result.rows.length);
    console.log('Row count:', result.rowCount);
    
    if (result.rowCount > 0) {
      console.log('Returning row 0:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('No rows returned, sending error response');
      res.status(500).json({ error: 'Failed to create transaction', details: `Row count: ${result.rowCount}, Rows: ${result.rows.length}` });
    }
  } catch (err) {
    console.error('Database error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { property_id, type, category, amount, description, date } = req.body;
    const result = await db.query(
      'UPDATE transactions SET property_id = $1, type = $2, category = $3, amount = $4, description = $5, date = $6 WHERE id = $7 RETURNING *',
      [property_id, type, category, amount, description, date, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM transactions WHERE id = $1', [id]);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rental rate history endpoints
app.get('/api/properties/:id/rent-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM rental_rate_history WHERE property_id = $1 ORDER BY effective_date ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/properties/:id/rent-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { monthly_rate, effective_date, reason } = req.body;
    console.log('Adding rent history:', { property_id: id, monthly_rate, effective_date, reason });
    
    const rentId = uuidv4();
    const result = await db.query(
      'INSERT INTO rental_rate_history (id, property_id, monthly_rate, effective_date, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [rentId, id, monthly_rate, effective_date, reason || 'Rate update', new Date().toISOString()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/properties/:id/rent-history/:rentId', authenticateToken, async (req, res) => {
  try {
    const { id, rentId } = req.params;
    const { monthly_rate, effective_date, reason } = req.body;
    debug.log('🏠 Backend updating rent history:', { property_id: id, rent_id: rentId, monthly_rate, effective_date, reason });
    debug.log('🏠 Request params:', { id, rentId });
    debug.log('🏠 Request body:', req.body);
    
    const result = await db.query(
      'UPDATE rental_rate_history SET monthly_rate = $1, effective_date = $2, reason = $3 WHERE id = $4 AND property_id = $5 RETURNING *',
      [monthly_rate, effective_date, reason || 'Rate update', rentId, id]
    );
    
    debug.log('✅ Database update result:', result.rows);
    res.json(result.rows[0]);
  } catch (err) {
    debug.error('❌ Error updating rent history:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/properties/:id/rent-history/:rentId', authenticateToken, async (req, res) => {
  try {
    const { id, rentId } = req.params;
    await db.query('DELETE FROM rental_rate_history WHERE id = $1 AND property_id = $2', [rentId, id]);
    res.json({ message: 'Rent history deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/properties/:id/market-value', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { market_value, redfin_market_value, redfin_data } = req.body;
    
    debug.log('🔄 Updating market value for property:', id, { market_value, redfin_market_value });
    
    // Update the property's market value in the database
    const result = await db.query(
      'UPDATE properties SET market_value = $1, redfin_market_value = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [market_value, redfin_market_value, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    debug.log('✅ Market value updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    debug.error('❌ Error updating market value:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redfin web scraping endpoints
const redfinScrapeRouter = require('./api/redfin-scrape');
const redfinSearchRouter = require('./api/redfin-search');
app.use('/api/redfin', redfinScrapeRouter);
app.use('/api/redfin', redfinSearchRouter);

// Test AVM endpoint
const testAVMRouter = require('./api/test-avm');
app.use('/api/avm', testAVMRouter);

// County Assessor endpoint (real implementation)
const countyAssessorRouter = require('./api/county-assessor-real');
app.use('/api/county', countyAssessorRouter);

// Redfin Market Value Integration endpoint
const redfinMarketValueRouter = require('./api/redfin-market-value-integration');
app.use('/api/redfin-market-value', redfinMarketValueRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log('Server file loaded completely');
