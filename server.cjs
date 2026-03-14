const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ═══════════════════════════════════════════════════════
// DATABASE SETUP
// ═══════════════════════════════════════════════════════
const dbPath = path.resolve(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err.message);
  else {
    console.log('Connected to SQLite local database.');
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    // Core tables (from Prisma schema, may already exist)
    db.run(`CREATE TABLE IF NOT EXISTS "Transaction" (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT DEFAULT (datetime('now')),
      description TEXT,
      upiRef TEXT UNIQUE,
      isAnomaly INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Budget (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      UNIQUE(userId, category, month)
    )`);

    // New: User profile table for income, profession, risk
    db.run(`CREATE TABLE IF NOT EXISTS UserProfile (
      userId TEXT PRIMARY KEY,
      monthlyIncome REAL DEFAULT 0,
      profileType TEXT DEFAULT 'employee',
      riskLevel TEXT DEFAULT 'medium',
      phone TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )`);

    // New: User-tracked investments (manual entry)
    db.run(`CREATE TABLE IF NOT EXISTS Investment (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      invested REAL NOT NULL,
      currentValue REAL NOT NULL,
      startDate TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )`);

    // New: Savings goals
    db.run(`CREATE TABLE IF NOT EXISTS SavingsGoal (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      target REAL NOT NULL,
      saved REAL DEFAULT 0,
      color TEXT DEFAULT '#8b5cf6',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )`);
  });
}

// ═══════════════════════════════════════════════════════
// AUTH MIDDLEWARE (Mock locally — in prod use Clerk)
// ═══════════════════════════════════════════════════════
app.use((req, res, next) => {
  req.auth = { userId: 'user_local_dev', email: 'user@financeapp.com' };
  next();
});

// ═══════════════════════════════════════════════════════
// GEMINI AI HELPER
// ═══════════════════════════════════════════════════════
async function callGemini(prompt, isJson = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set in .env');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(isJson ? { responseMimeType: 'application/json' } : {})
    }
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Helper to get user financial summary
function getUserFinancialSummary(userId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM "Transaction" WHERE userId = ?`, [userId], (err, txns) => {
      if (err) return reject(err);
      db.get(`SELECT * FROM UserProfile WHERE userId = ?`, [userId], (err2, profile) => {
        if (err2) return reject(err2);

        let income = profile?.monthlyIncome || 0;
        let expense = 0;
        const spendingByCategory = {};
        const currentMonth = new Date().toISOString().slice(0, 7);

        txns.forEach(t => {
          const txMonth = (t.date || '').slice(0, 7);
          if (t.type === 'income') income += t.amount;
          if (t.type === 'expense') {
            expense += t.amount;
            spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
          }
        });

        resolve({
          totalIncome: income,
          totalExpense: expense,
          savings: income - expense,
          savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
          spendingByCategory,
          profileType: profile?.profileType || 'employee',
          riskLevel: profile?.riskLevel || 'medium',
          transactionCount: txns.length
        });
      });
    });
  });
}

// ═══════════════════════════════════════════════════════
// USER PROFILE API
// ═══════════════════════════════════════════════════════
app.get('/api/user/profile', (req, res) => {
  const { userId } = req.auth;
  db.get(`SELECT * FROM UserProfile WHERE userId = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { userId, monthlyIncome: 0, profileType: 'employee', riskLevel: 'medium', phone: '' });
  });
});

app.put('/api/user/profile', (req, res) => {
  const { userId } = req.auth;
  const { monthlyIncome, profileType, riskLevel, phone } = req.body;
  db.run(
    `INSERT INTO UserProfile (userId, monthlyIncome, profileType, riskLevel, phone, updatedAt)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(userId) DO UPDATE SET
       monthlyIncome = excluded.monthlyIncome,
       profileType = excluded.profileType,
       riskLevel = excluded.riskLevel,
       phone = excluded.phone,
       updatedAt = datetime('now')`,
    [userId, monthlyIncome || 0, profileType || 'employee', riskLevel || 'medium', phone || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, userId, monthlyIncome, profileType, riskLevel, phone });
    }
  );
});

// ═══════════════════════════════════════════════════════
// TRANSACTIONS API
// ═══════════════════════════════════════════════════════
app.get('/api/transactions', (req, res) => {
  const { userId } = req.auth;
  const { category, type, limit = 100 } = req.query;
  let query = `SELECT * FROM "Transaction" WHERE userId = ?`;
  const params = [userId];
  if (category) { query += ` AND category = ?`; params.push(category); }
  if (type) { query += ` AND type = ?`; params.push(type); }
  query += ` ORDER BY date DESC LIMIT ?`;
  params.push(parseInt(limit));
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const { userId } = req.auth;
  const { amount, category, type, description, upiRef, date } = req.body;
  if (!amount || !category || !type) {
    return res.status(400).json({ error: 'amount, category, and type are required' });
  }
  const id = crypto.randomUUID();
  const txDate = date || new Date().toISOString();
  const isAnomaly = amount > 50000 ? 1 : 0;

  const doInsert = () => {
    db.run(
      `INSERT INTO "Transaction" (id, userId, amount, category, type, description, upiRef, isAnomaly, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, amount, category, type, description || '', upiRef || null, isAnomaly, txDate],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id, amount, category, type, description, upiRef, isAnomaly, date: txDate });
      }
    );
  };

  if (upiRef) {
    db.get(`SELECT id FROM "Transaction" WHERE upiRef = ?`, [upiRef], (err, row) => {
      if (row) return res.status(409).json({ error: 'Duplicate UPI transaction (reference already exists)' });
      doInsert();
    });
  } else {
    doInsert();
  }
});

app.put('/api/transactions/:id', (req, res) => {
  const { userId } = req.auth;
  const { id } = req.params;
  const { amount, category, type, description, date } = req.body;
  db.run(
    `UPDATE "Transaction" SET amount = ?, category = ?, type = ?, description = ?, date = ?, updatedAt = datetime('now')
     WHERE id = ? AND userId = ?`,
    [amount, category, type, description, date, id, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
      res.json({ success: true });
    }
  );
});

app.delete('/api/transactions/:id', (req, res) => {
  const { userId } = req.auth;
  const { id } = req.params;
  db.run(`DELETE FROM "Transaction" WHERE id = ? AND userId = ?`, [id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  });
});

// UPI bulk import with dedup
app.post('/api/transactions/upi-import', (req, res) => {
  const { userId } = req.auth;
  const { transactions } = req.body; // array of { amount, category, type, description, upiRef, date }
  if (!Array.isArray(transactions)) return res.status(400).json({ error: 'Expected array of transactions' });

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const tasks = transactions.map(tx => new Promise(resolve => {
    const id = crypto.randomUUID();
    const upiRef = tx.upiRef || null;
    const txDate = tx.date || new Date().toISOString();

    const doInsert = () => {
      db.run(
        `INSERT OR IGNORE INTO "Transaction" (id, userId, amount, category, type, description, upiRef, isAnomaly, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, tx.amount, tx.category || 'other', tx.type || 'expense', tx.description || '', upiRef, 0, txDate],
        function(err2) {
          if (err2) { errors++; } else if (this.changes > 0) { inserted++; } else { duplicates++; }
          resolve();
        }
      );
    };

    if (upiRef) {
      db.get(`SELECT id FROM "Transaction" WHERE upiRef = ?`, [upiRef], (err, row) => {
        if (row) { duplicates++; resolve(); } else { doInsert(); }
      });
    } else {
      doInsert();
    }
  }));

  Promise.all(tasks).then(() => {
    res.json({ inserted, duplicates, errors, total: transactions.length });
  });
});

// ═══════════════════════════════════════════════════════
// DASHBOARD STATS API
// ═══════════════════════════════════════════════════════
app.get('/api/dashboard/stats', (req, res) => {
  const { userId } = req.auth;

  db.get(`SELECT * FROM UserProfile WHERE userId = ?`, [userId], (err, profile) => {
    const manualIncome = profile?.monthlyIncome || 0;

    db.all(`SELECT * FROM "Transaction" WHERE userId = ?`, [userId], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });

      let incomeFromTxns = 0;
      let expense = 0;
      const spendingByCategory = {};
      const monthlyTrendsMap = {};

      rows.forEach(r => {
        if (r.type === 'income') incomeFromTxns += r.amount;
        if (r.type === 'expense') {
          expense += r.amount;
          spendingByCategory[r.category] = (spendingByCategory[r.category] || 0) + r.amount;
        }
        const dateObj = new Date(r.date);
        const month = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlyTrendsMap[month]) {
          monthlyTrendsMap[month] = { month, income: 0, expense: 0, savings: 0, sortKey: dateObj.getTime() };
        }
        if (r.type === 'income') monthlyTrendsMap[month].income += r.amount;
        if (r.type === 'expense') monthlyTrendsMap[month].expense += r.amount;
      });

      const totalIncome = incomeFromTxns + manualIncome;
      Object.values(monthlyTrendsMap).forEach(m => m.savings = m.income - m.expense);

      // Sort trends chronologically
      const monthlyTrends = Object.values(monthlyTrendsMap)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ sortKey, ...rest }) => rest);

      res.json({
        totalIncome,
        totalSpent: expense,
        currentSavings: totalIncome - expense,
        savingsRate: totalIncome > 0 ? Math.round(((totalIncome - expense) / totalIncome) * 100) : 0,
        spendingByCategory,
        monthlyTrends,
        manualMonthlyIncome: manualIncome,
        profileType: profile?.profileType || 'employee',
        transactionCount: rows.length
      });
    });
  });
});

// ═══════════════════════════════════════════════════════
// BUDGET API
// ═══════════════════════════════════════════════════════
app.get('/api/budgets', (req, res) => {
  const { userId } = req.auth;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  db.all(`SELECT * FROM Budget WHERE userId = ? AND month = ?`, [userId, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/budgets', (req, res) => {
  const { userId } = req.auth;
  const { category, amount, month } = req.body;
  const id = crypto.randomUUID();
  const m = month || new Date().toISOString().slice(0, 7);
  db.run(
    `INSERT INTO Budget (id, userId, category, amount, month) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(userId, category, month) DO UPDATE SET amount = excluded.amount`,
    [id, userId, category, amount, m],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, userId, category, amount, month: m });
    }
  );
});

app.delete('/api/budgets/:id', (req, res) => {
  const { userId } = req.auth;
  db.run(`DELETE FROM Budget WHERE id = ? AND userId = ?`, [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ═══════════════════════════════════════════════════════
// SAVINGS GOALS API
// ═══════════════════════════════════════════════════════
app.get('/api/savings/goals', (req, res) => {
  const { userId } = req.auth;
  db.all(`SELECT * FROM SavingsGoal WHERE userId = ? ORDER BY createdAt DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/savings/goals', (req, res) => {
  const { userId } = req.auth;
  const { name, target, saved, color } = req.body;
  if (!name || !target) return res.status(400).json({ error: 'name and target are required' });
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO SavingsGoal (id, userId, name, target, saved, color) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, name, target, saved || 0, color || '#8b5cf6'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, userId, name, target, saved: saved || 0, color });
    }
  );
});

app.put('/api/savings/goals/:id', (req, res) => {
  const { userId } = req.auth;
  const { name, target, saved, color } = req.body;
  db.run(
    `UPDATE SavingsGoal SET name = ?, target = ?, saved = ?, color = ?, updatedAt = datetime('now')
     WHERE id = ? AND userId = ?`,
    [name, target, saved, color, req.params.id, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/savings/goals/:id', (req, res) => {
  const { userId } = req.auth;
  db.run(`DELETE FROM SavingsGoal WHERE id = ? AND userId = ?`, [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ═══════════════════════════════════════════════════════
// INVESTMENTS API (Manual tracking)
// ═══════════════════════════════════════════════════════
app.get('/api/investments', (req, res) => {
  const { userId } = req.auth;
  db.all(`SELECT * FROM Investment WHERE userId = ? ORDER BY createdAt DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/investments', (req, res) => {
  const { userId } = req.auth;
  const { name, type, invested, currentValue, startDate, notes } = req.body;
  if (!name || !type || !invested) return res.status(400).json({ error: 'name, type, and invested are required' });
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO Investment (id, userId, name, type, invested, currentValue, startDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, name, type, invested, currentValue || invested, startDate || new Date().toISOString(), notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, name, type, invested, currentValue: currentValue || invested });
    }
  );
});

app.put('/api/investments/:id', (req, res) => {
  const { userId } = req.auth;
  const { name, type, invested, currentValue, notes } = req.body;
  db.run(
    `UPDATE Investment SET name=?, type=?, invested=?, currentValue=?, notes=?, updatedAt=datetime('now')
     WHERE id=? AND userId=?`,
    [name, type, invested, currentValue, notes, req.params.id, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/investments/:id', (req, res) => {
  const { userId } = req.auth;
  db.run(`DELETE FROM Investment WHERE id = ? AND userId = ?`, [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ═══════════════════════════════════════════════════════
// SOS ALERTS API (Real computed alerts)
// ═══════════════════════════════════════════════════════
app.get('/api/alerts', (req, res) => {
  const { userId } = req.auth;

  getUserFinancialSummary(userId).then(summary => {
    db.all(`SELECT * FROM Budget WHERE userId = ? AND month = ?`,
      [userId, new Date().toISOString().slice(0, 7)],
      (err, budgets) => {
        const alerts = [];

        // Alert 1: Low savings rate
        if (summary.totalIncome > 0 && summary.savingsRate < 20) {
          alerts.push({
            id: 'saving-sos',
            type: 'saving',
            title: 'Monthly Saving SOS',
            message: `Your saving rate is ${summary.savingsRate}% — below the recommended 20%. You're spending ₹${summary.totalExpense.toLocaleString('en-IN')} out of ₹${summary.totalIncome.toLocaleString('en-IN')} income.`,
            severity: 'high',
            action: 'Review Spending',
            color: 'cyan',
          });
        }

        // Alert 2: Over-budget categories
        if (budgets && budgets.length > 0) {
          budgets.forEach(budget => {
            const spent = summary.spendingByCategory[budget.category] || 0;
            if (spent > budget.amount) {
              const overage = spent - budget.amount;
              alerts.push({
                id: `budget-${budget.category}`,
                type: 'budget',
                title: `${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)} Budget Exceeded`,
                message: `You've spent ₹${spent.toLocaleString('en-IN')} on ${budget.category} — ₹${overage.toLocaleString('en-IN')} over your ₹${budget.amount.toLocaleString('en-IN')} limit.`,
                severity: 'medium',
                action: 'Set New Limit',
                color: 'amber',
              });
            }
          });
        }

        // Alert 3: Large single transaction anomaly
        db.get(`SELECT * FROM "Transaction" WHERE userId = ? AND isAnomaly = 1 ORDER BY date DESC LIMIT 1`,
          [userId], (err2, anomaly) => {
            if (anomaly) {
              alerts.push({
                id: `anomaly-${anomaly.id}`,
                type: 'anomaly',
                title: 'Large Transaction Detected',
                message: `Unusual transaction of ₹${anomaly.amount.toLocaleString('en-IN')} detected for "${anomaly.description}". Verify this is legitimate.`,
                severity: 'high',
                action: 'Review Transaction',
                color: 'amber',
              });
            }

            // Alert 4: Investment opportunity (surplus)
            const surplus = summary.currentSavings || (summary.totalIncome - summary.totalExpense);
            if (surplus > 5000 && summary.totalIncome > 0) {
              alerts.push({
                id: 'investment-opp',
                type: 'investment',
                title: 'Investment Opportunity',
                message: `Great job! You have a surplus of ₹${surplus.toLocaleString('en-IN')} this period. Consider putting it to work in a Nifty 50 index fund or liquid mutual fund for better returns than a savings account.`,
                severity: 'low',
                action: 'View Investment Plan',
                color: 'emerald',
              });
            }

            // Alert 5: No income set
            if (summary.totalIncome === 0) {
              alerts.push({
                id: 'no-income',
                type: 'info',
                title: 'Set Your Monthly Income',
                message: 'To get accurate financial insights and SOS alerts, please set your monthly income in your profile.',
                severity: 'info',
                action: 'Set Income',
                color: 'cyan',
              });
            }

            res.json(alerts);
          }
        );
      }
    );
  }).catch(err => res.status(500).json({ error: err.message }));
});

// ═══════════════════════════════════════════════════════
// AI ENDPOINTS
// ═══════════════════════════════════════════════════════

// AI Financial Insights
app.get('/api/ai/insights', async (req, res) => {
  const { userId } = req.auth;
  try {
    const summary = await getUserFinancialSummary(userId);

    if (summary.transactionCount === 0) {
      return res.json([
        { id: 1, title: 'Add Your First Transaction', text: 'Start tracking your income and expenses to get personalized AI financial insights.', impact: 'Get started', icon: 'plus' },
        { id: 2, title: 'Set Monthly Income', text: 'Tell us your monthly income so we can calculate your savings rate and give you tailored advice.', impact: 'Setup', icon: 'wallet' },
        { id: 3, title: 'Set Budgets', text: 'Define spending limits for each category to keep your finances on track.', impact: 'Control spending', icon: 'target' },
        { id: 4, title: 'Explore Investment Plans', text: 'Once you have income data, our AI will suggest personalized investment strategies.', impact: 'Grow wealth', icon: 'trending-up' },
      ]);
    }

    const categoryBreakdown = Object.entries(summary.spendingByCategory)
      .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`)
      .join(', ');

    const prompt = `You are a certified Indian financial advisor. Analyze this user's financial data and give exactly 4 specific, actionable suggestions.

Financial Data:
- Total Income: ₹${summary.totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${summary.totalExpense.toLocaleString('en-IN')}
- Savings: ₹${(summary.totalIncome - summary.totalExpense).toLocaleString('en-IN')}
- Savings Rate: ${summary.savingsRate}%
- Profile: ${summary.profileType}
- Spending breakdown: ${categoryBreakdown || 'No categories yet'}

Return ONLY a valid JSON array with exactly 4 objects. Each object must have:
- "id": number (1-4)
- "title": string (short, max 5 words)
- "text": string (specific advice with actual rupee amounts from their data, 1-2 sentences)
- "impact": string (e.g. "₹2,000/mo" or "Save ₹15,000 tax")
- "icon": one of: "utensils", "target", "bar-chart", "trending-up", "shield", "piggy-bank"

Give real, specific Indian finance advice (ELSS, PPF, NPS, SIP, term insurance, health insurance from IRDAI-approved insurers). Do not include mock data or generic advice.`;

    const text = await callGemini(prompt, true);
    const jsonMatch = text.match(/\[[\s\S]*\]/) || [text];
    const suggestions = JSON.parse(jsonMatch[0]);
    res.json(suggestions);
  } catch (err) {
    console.error('AI insights error:', err.message);
    res.json([
      { id: 1, title: 'AI Analysis Unavailable', text: `Could not connect to AI (${err.message}). Check your GEMINI_API_KEY in .env file.`, impact: 'Setup needed', icon: 'target' }
    ]);
  }
});

// AI Investment Plan
app.get('/api/ai/investment-plan', async (req, res) => {
  const { userId } = req.auth;
  try {
    const summary = await getUserFinancialSummary(userId);
    const surplus = Math.max(0, summary.totalIncome - summary.totalExpense);

    const prompt = `You are a SEBI-registered financial advisor in India. Create a personalized investment plan.

User Profile:
- Monthly Income: ₹${summary.totalIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${summary.totalExpense.toLocaleString('en-IN')}
- Monthly Investable Surplus: ₹${surplus.toLocaleString('en-IN')}
- Profile Type: ${summary.profileType} (e.g., student, employee, business owner, freelancer, retired)
- Risk Level: ${summary.riskLevel}
- Savings Rate: ${summary.savingsRate}%

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "2-sentence summary of their financial position",
  "investableSurplus": ${surplus},
  "recommendations": [
    {
      "id": 1,
      "category": "Emergency Fund / Term Insurance / Health Insurance / Equity / Debt / Gold / Tax Saving",
      "name": "Specific product name (e.g., HDFC Life Click2Protect, Star Health Comprehensive, Nifty 50 Index Fund)",
      "allocation": 15000,
      "type": "one-time or monthly SIP",
      "returns": "expected return % or benefit",
      "rationale": "Why this is right for their profile (1-2 sentences)",
      "realData": true
    }
  ],
  "taxSaving": {
    "section80C": "specific instruments for 80C",
    "section80D": "health insurance info",
    "otherDeductions": "NPS, HRA etc if applicable"
  },
  "healthInsurance": {
    "recommended": "product name from IRDAI-approved insurer",
    "coverAmount": "₹X lakhs",
    "features": "key features",
    "monthlyPremium": "₹X approx"
  }
}

Tailor for the ${summary.profileType} profile. Give REAL, verifiable Indian financial products only. If surplus is ₹0 or income is ₹0, suggest building income/emergency fund first.`;

    const text = await callGemini(prompt, true);
    const jsonMatch = text.match(/\{[\s\S]*\}/) || [text];
    const plan = JSON.parse(jsonMatch[0]);
    res.json(plan);
  } catch (err) {
    console.error('AI investment plan error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// AI Chat
app.post('/api/ai/chat', async (req, res) => {
  const { userId } = req.auth;
  const { message, language } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    const summary = await getUserFinancialSummary(userId);
    const categoryBreakdown = Object.entries(summary.spendingByCategory)
      .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`)
      .join(', ');

    const langInstruction = language && language !== 'en'
      ? `IMPORTANT: Respond in ${language} language (the user selected this language).`
      : '';

    const prompt = `You are a helpful, friendly AI financial coach for an Indian personal finance app. ${langInstruction}

User's current financial data:
- Total Income: ₹${summary.totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${summary.totalExpense.toLocaleString('en-IN')}
- Current Savings: ₹${(summary.totalIncome - summary.totalExpense).toLocaleString('en-IN')}
- Savings Rate: ${summary.savingsRate}%
- Profile: ${summary.profileType}
- Spending breakdown: ${categoryBreakdown || 'No transactions yet'}

User's question: "${message}"

Give a helpful, concise response (2-4 sentences max) using their actual data. Reference real rupee amounts from their data. Suggest real Indian financial products when relevant (specific mutual funds, insurance providers, government schemes). Be conversational and encouraging.`;

    const reply = await callGemini(prompt);
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.json({ reply: `I'm having trouble connecting to the AI right now. Please check your GEMINI_API_KEY in the .env file. Error: ${err.message}` });
  }
});

// ═══════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend Server running at http://localhost:${PORT}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Connected' : '⚠️  GEMINI_API_KEY not set'}`);
});
