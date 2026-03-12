const { Pool } = require('pg');
require('dotenv').config();

async function createTables() {
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  const pool = new Pool({ connectionString });

  try {
    console.log('Creating database tables...');

    // Properties table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        purchase_price DECIMAL(12,2) NOT NULL,
        monthly_rent DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Properties table created');

    // Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Transactions table created');

    // Indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON transactions(property_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
    console.log('✅ Indexes created');

    // Function to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✅ Update function created');

    // Trigger to automatically update updated_at
    await pool.query(`
      CREATE TRIGGER update_properties_updated_at 
        BEFORE UPDATE ON properties 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Trigger created');

    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await pool.end();
  }
}

createTables();
