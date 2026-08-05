const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  console.log('Running migration to update properties...');
  
  let connectionString;
  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
    connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  } else {
    connectionString = `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  }
  
  const pool = new Pool({ connectionString });

  try {
    // Add current_rent column if it doesn't exist
    console.log('Adding current_rent column...');
    try {
      await pool.query(`
        ALTER TABLE properties 
        ADD COLUMN IF NOT EXISTS current_rent DECIMAL(10,2) DEFAULT 0
      `);
      console.log('✅ current_rent column added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ current_rent column already exists');
      } else {
        throw error;
      }
    }

    // Update existing properties to set current_rent = monthly_rent if it's NULL
    console.log('Updating current_rent field...');
    await pool.query(`
      UPDATE properties 
      SET current_rent = monthly_rent 
      WHERE current_rent IS NULL
    `);
    console.log('✅ current_rent field updated');

    // Add sample rent history for existing properties that don't have any
    console.log('Adding sample rent history...');
    
    // First create the rental_rate_history table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS rental_rate_history (
          id VARCHAR(50) PRIMARY KEY,
          property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          monthly_rate DECIMAL(10,2) NOT NULL,
          effective_date DATE NOT NULL,
          end_date DATE,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ rental_rate_history table created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ rental_rate_history table already exists');
      } else {
        throw error;
      }
    }

    // Insert sample data
    await pool.query(`
      INSERT INTO rental_rate_history (id, property_id, monthly_rate, effective_date, end_date, reason, created_at, updated_at)
      SELECT 
        gen_random_uuid() as id,
        p.id as property_id,
        p.monthly_rent as monthly_rate,
        CURRENT_DATE as effective_date,
        NULL as end_date,
        'Initial rate setup' as reason,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
      FROM properties p 
      WHERE p.id NOT IN (
        SELECT DISTINCT property_id FROM rental_rate_history
      )
      LIMIT 5
    `);
    console.log('✅ Sample rent history added');

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
