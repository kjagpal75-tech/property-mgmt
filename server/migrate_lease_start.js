const db = require('./db.js');

async function addLeaseStartDateColumn() {
  try {
    console.log('Adding lease_start_date column to properties table...');
    
    // Check if column already exists
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      AND column_name = 'lease_start_date'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('lease_start_date column already exists');
      return;
    }
    
    // Add the column
    await db.query('ALTER TABLE properties ADD COLUMN lease_start_date DATE');
    console.log('✅ lease_start_date column added successfully');
    
  } catch (error) {
    if (error.code === '42701') {
      console.log('ℹ️ lease_start_date column already exists');
    } else {
      console.error('❌ Error adding lease_start_date column:', error);
    }
  } finally {
    // Don't close the connection as it's shared with the server
  }
}

addLeaseStartDateColumn().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
