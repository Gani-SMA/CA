const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'dev.db');

// Connect to (or create) the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
    process.exit(1);
  }
  console.log('Connected to local SQLite database (dev.db)');
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      clerkId TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      firstName TEXT,
      lastName TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS "Transaction" (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT NOT NULL,
      upiRef TEXT UNIQUE,
      isAnomaly BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Budget (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      UNIQUE(userId, category, month),
      FOREIGN KEY (userId) REFERENCES User(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS InvestmentPlan (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      profileType TEXT NOT NULL,
      riskLevel TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id)
    )
  `);

  console.log('Successfully created tables: User, Transaction, Budget, InvestmentPlan');
});

db.close();
