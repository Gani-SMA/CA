const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to SQLite Database
const dbPath = path.resolve(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to SQLite local database.');
});

// Middleware to mock Clerk auth locally if no webhooks (since we are testing)
// In production, this would use Clerk's express middleware
app.use((req, res, next) => {
  req.auth = { userId: "user_2lKxjX5Jk8tqMzR2n7Tvw1bC9mZ", email: "test@investor.com" }; // Mock local authenticated user
  next();
});

// ═══════════ TRANSACTIONS API ═══════════
app.get('/api/transactions', (req, res) => {
  const { userId } = req.auth;
  db.all(`SELECT * FROM "Transaction" WHERE userId = ? ORDER BY date DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const { userId } = req.auth;
  const { amount, category, type, description, upiRef } = req.body;
  const id = require('crypto').randomUUID();
  
  // Basic validation (duplicate UPI refs)
  if (upiRef) {
    db.get('SELECT id FROM "Transaction" WHERE upiRef = ?', [upiRef], (err, row) => {
      if (row) return res.status(409).json({ error: 'Duplicate transaction (UPI Reference already exists)' });
      insertTransaction();
    });
  } else {
    insertTransaction();
  }

  function insertTransaction() {
    const isAnomaly = amount > 50000 ? 1 : 0; // Simple mock ML rule: > 50k is anomaly
    db.run(
      `INSERT INTO "Transaction" (id, userId, amount, category, type, description, upiRef, isAnomaly) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, amount, category, type, description, upiRef, isAnomaly],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id, amount, category, type, isAnomaly });
      }
    );
  }
});

// ═══════════ DASHBOARD STATS API ═══════════
app.get('/api/dashboard/stats', (req, res) => {
  const { userId } = req.auth;

  // Fetch all transactions to build rich analytics cleanly in JS
  db.all(
    `SELECT * FROM "Transaction" WHERE userId = ?`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let income = 0;
      let expense = 0;
      const spendingByCategory = {};
      const monthlyTrendsMap = {};
      
      rows.forEach(r => {
        // Totals
        if (r.type === 'income') income += r.amount;
        if (r.type === 'expense') {
          expense += r.amount;
          spendingByCategory[r.category] = (spendingByCategory[r.category] || 0) + r.amount;
        }

        // Trends (e.g. "Mar")
        const dateObj = new Date(r.date);
        const month = dateObj.toLocaleString('default', { month: 'short' });
        
        if (!monthlyTrendsMap[month]) {
          monthlyTrendsMap[month] = { month, income: 0, expense: 0, savings: 0 };
        }
        
        if (r.type === 'income') monthlyTrendsMap[month].income += r.amount;
        if (r.type === 'expense') monthlyTrendsMap[month].expense += r.amount;
      });

      // Calculate monthly savings
      Object.values(monthlyTrendsMap).forEach(m => m.savings = m.income - m.expense);

      res.json({
        totalIncome: income,
        totalSpent: expense,
        currentSavings: income - expense,
        savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
        spendingByCategory,
        monthlyTrends: Object.values(monthlyTrendsMap)
      });
    }
  );
});

// ═══════════ SAVINGS GOALS API ═══════════
app.get('/api/savings/goals', (req, res) => {
  const { userId } = req.auth;

  // For this prototype, we'll map Budgets as "Savings Goals" 
  // where the goal is to not spend the budget.
  db.all(`SELECT * FROM Budget WHERE userId = ?`, [userId], (err, budgets) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(`SELECT category, SUM(amount) as spent FROM "Transaction" WHERE userId = ? AND type = 'expense' GROUP BY category`, [userId], (err, expenses) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const expenseMap = {};
      expenses.forEach(e => expenseMap[e.category] = e.spent);

      // Map to the shape expected by GrowthGrove.jsx
      const goals = budgets.map(b => {
        const spent = expenseMap[b.category] || 0;
        const saved = Math.max(0, b.amount - spent);
        return {
          id: b.id,
          name: b.category.charAt(0).toUpperCase() + b.category.slice(1) + ' Fund',
          target: b.amount,
          saved: saved
        };
      });

      res.json(goals);
    });
  });
});

// ═══════════ AI & INVESTMENTS API (Placeholder) ═══════════
app.get('/api/investments/plan', (req, res) => {
  res.json({
    message: "AI Endpoint initializing..."
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend Server running locally on http://localhost:${PORT}`);
});
