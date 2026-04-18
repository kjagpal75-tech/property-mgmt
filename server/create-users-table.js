const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?timezone=America/Los_Angeles`
});

async function createUsersTable() {
  try {
    console.log('Creating users table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true
      )
    `);
    
    console.log('✅ Users table created successfully');
    
    // Create index on username for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
    
    // Create index on email for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createUsersTable();
