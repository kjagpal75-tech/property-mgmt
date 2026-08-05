const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...');
  
  let connectionString;
  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
    connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  } else {
    connectionString = `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  }
  
  console.log('Connection string:', connectionString);
  
  const pool = new Pool({ connectionString });

  try {
    const result = await pool.query('SELECT version()');
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('properties', 'transactions')
    `);
    console.log('Tables found:', tablesResult.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await pool.end();
  }
}

testConnection();
