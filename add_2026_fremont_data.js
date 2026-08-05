const sqlite3 = require('sqlite3').verbose();

// Database connection
const db = new sqlite3.Database('./server/properties.db');

// Fremont Rental property ID
const propertyId = 'ced72e7a-3931-4ef5-9197-bc62e64bc835';

// 2026 transaction data based on user's numbers:
// Gross rent: $15,097.00
// Expenses: $6,843.24  
// Net income: $8,253.76

const transactions = [
  // Income transactions (rent) - total $15,097
  { type: 'income', category: 'rent', amount: 4200.00, description: 'Jan Rent 2026', date: '2026-01-01' },
  { type: 'income', category: 'rent', amount: 4200.00, description: 'Feb Rent 2026', date: '2026-02-01' },
  { type: 'income', category: 'rent', amount: 4200.00, description: 'Mar Rent 2026', date: '2026-03-01' },
  { type: 'income', category: 'rent', amount: 2497.00, description: 'Apr Rent 2026', date: '2026-04-01' },
  
  // Expense transactions - total $6,843.24
  { type: 'expense', category: 'maintenance', amount: 500.00, description: 'Maintenance 2026', date: '2026-01-15' },
  { type: 'expense', category: 'property_tax', amount: 3000.00, description: 'Property Tax 2026', date: '2026-02-01' },
  { type: 'expense', category: 'insurance', amount: 1200.00, description: 'Insurance 2026', date: '2026-03-01' },
  { type: 'expense', category: 'hoa', amount: 100.00, description: 'HOA Fees 2026', date: '2026-04-01' },
  { type: 'expense', category: 'repairs', amount: 2043.24, description: 'Repairs 2026', date: '2026-04-15' }
];

async function addTransactions() {
  console.log('Adding 2026 transactions for Fremont Rental...');
  
  for (const transaction of transactions) {
    const id = Math.random().toString(36).substr(2, 9);
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO transactions (id, property_id, type, category, amount, description, date, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, propertyId, transaction.type, transaction.category, transaction.amount, transaction.description, transaction.date],
        function(err) {
          if (err) {
            console.error('Error inserting transaction:', err);
            reject(err);
          } else {
            console.log(`Added: ${transaction.description} - $${transaction.amount}`);
            resolve(this);
          }
        }
      );
    });
  }
  
  console.log('All 2026 transactions added successfully!');
  db.close();
}

addTransactions().catch(console.error);
