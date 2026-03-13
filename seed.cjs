const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
    process.exit(1);
  }
});

const userId = "user_2lKxjX5Jk8tqMzR2n7Tvw1bC9mZ"; // From server.cjs mock middleware

const transactions = [
  { id: require('crypto').randomUUID(), amount: 150000, category: 'salary', type: 'income', description: 'Tech Corp Salary', upiRef: 'UPI-IN-1', isAnomaly: 0 },
  { id: require('crypto').randomUUID(), amount: 12000, category: 'food', type: 'expense', description: 'Groceries', upiRef: null, isAnomaly: 0 },
  { id: require('crypto').randomUUID(), amount: 25000, category: 'bills', type: 'expense', description: 'Rent', upiRef: 'UPI-EX-1', isAnomaly: 0 },
  { id: require('crypto').randomUUID(), amount: 8000, category: 'transport', type: 'expense', description: 'Fuel & Cab', upiRef: null, isAnomaly: 0 },
  { id: require('crypto').randomUUID(), amount: 65000, category: 'investment', type: 'expense', description: 'Stocks / Mutual Funds', upiRef: 'UPI-EX-2', isAnomaly: 1 } // Large expense triggers anomaly loosely
];

db.serialize(() => {
  db.run("BEGIN TRANSACTION");
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO "Transaction" (id, userId, amount, category, type, description, upiRef, isAnomaly) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  transactions.forEach(t => {
    stmt.run(t.id, userId, t.amount, t.category, t.type, t.description, t.upiRef, t.isAnomaly);
  });

  stmt.finalize();
  db.run("COMMIT", (err) => {
    if (err) console.error("Commit failed", err);
    else console.log("Seeded transactions successfully!");
    db.close();
  });
});
