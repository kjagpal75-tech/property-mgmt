const express = require('express');
const cors = require('cors');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Properties endpoints
app.get('/api/properties', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM properties ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const { name, address, purchase_price, monthly_rent } = req.body;
    const id = uuidv4();
    const result = await db.query(
      'INSERT INTO properties (id, name, address, purchase_price, monthly_rent) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, address, purchase_price, monthly_rent]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, purchase_price, monthly_rent } = req.body;
    const result = await db.query(
      'UPDATE properties SET name = $1, address = $2, purchase_price = $3, monthly_rent = $4 WHERE id = $5 RETURNING *',
      [name, address, purchase_price, monthly_rent, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM properties WHERE id = $1', [id]);
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Transactions endpoints
app.get('/api/transactions', async (req, res) => {
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

app.post('/api/transactions', async (req, res) => {
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

app.put('/api/transactions/:id', async (req, res) => {
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

app.delete('/api/transactions/:id', async (req, res) => {
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
app.get('/api/properties/:id/rent-history', async (req, res) => {
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

app.post('/api/properties/:id/rent-history', async (req, res) => {
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

app.put('/api/properties/:id/rent-history/:rentId', async (req, res) => {
  try {
    const { id, rentId } = req.params;
    const { monthly_rate, effective_date, reason } = req.body;
    console.log('Updating rent history:', { property_id: id, rent_id, monthly_rate, effective_date, reason });
    
    const result = await db.query(
      'UPDATE rental_rate_history SET monthly_rate = $1, effective_date = $2, reason = $3 WHERE id = $4 AND property_id = $5 RETURNING *',
      [monthly_rate, effective_date, reason || 'Rate update', rentId, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/properties/:id/rent-history/:rentId', async (req, res) => {
  try {
    const { id, rentId } = req.params;
    await db.query('DELETE FROM rental_rate_history WHERE id = $1 AND property_id = $2', [rentId, id]);
    res.json({ message: 'Rent history deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
