const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const SALT_ROUNDS = 10;

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Auth server working' });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  console.log('Register endpoint called');
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email',
      [username, email, passwordHash, firstName || null, lastName || null]
    );
    
    const user = result.rows[0];
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Login endpoint called');
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protected route for token validation
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    res.json({ user: { userId: user.userId, username: user.username } });
  });
});

// Password reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  console.log('Password reset endpoint called');
  try {
    const { username, email, newPassword } = req.body;
    
    if (!username || !email || !newPassword) {
      return res.status(400).json({ error: 'Username, email, and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Find user by username and email
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND email = $2',
      [username, email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found with these credentials' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 AND email = $3',
      [passwordHash, username, email]
    );
    
    res.json({ message: 'Password reset successfully' });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

app.listen(5001, () => {
  console.log('Auth test server running on port 5001');
});
