import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PlusCircle, Trash2, Edit3, Check, X, Upload, Search,
  ArrowDownCircle, ArrowUpCircle, Filter, RefreshCw
} from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, API_BASE } from '../data/constants';
import './TransactionManager.css';

const EMPTY_FORM = {
  amount: '',
  category: 'food',
  type: 'expense',
  description: '',
  upiRef: '',
  date: new Date().toISOString().slice(0, 10),
};

export default function TransactionManager({ onDataChanged }) {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchText, setSearchText] = useState(initialQuery);
  const [filterType, setFilterType] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/transactions?limit=200`);
      const data = await res.json();
      setTransactions(data);
    } catch (e) {
      setError('Failed to load transactions. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchText(q);
    }
  }, [searchParams]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) return setError('Please enter a valid amount');
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add transaction');
      setForm(EMPTY_FORM);
      await fetchTransactions();
      onDataChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await fetch(`${API_BASE}/api/transactions/${id}`, { method: 'DELETE' });
      setTransactions(prev => prev.filter(t => t.id !== id));
      onDataChanged?.();
    } catch (e) { setError('Delete failed'); }
  };

  const startEdit = (tx) => {
    setEditId(tx.id);
    setEditForm({
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      description: tx.description,
      date: (tx.date || '').slice(0, 10),
    });
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, amount: parseFloat(editForm.amount) }),
      });
      if (!res.ok) throw new Error('Update failed');
      setEditId(null);
      await fetchTransactions();
      onDataChanged?.();
    } catch (e) { setError('Update failed'); }
  };

  const handleUpiImport = async () => {
    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      let parsed;
      try { parsed = JSON.parse(importText); } catch { throw new Error('Invalid JSON format'); }
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of transactions');
      const res = await fetch(`${API_BASE}/api/transactions/upi-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: parsed }),
      });
      const result = await res.json();
      setImportResult(result);
      await fetchTransactions();
      onDataChanged?.();
    } catch (e) { setError(e.message); }
    finally { setImporting(false); }
  };

  // Filtered view
  const filtered = transactions.filter(t => {
    const matchText = !searchText ||
      (t.description?.toLowerCase().includes(searchText.toLowerCase())) ||
      (t.category?.toLowerCase().includes(searchText.toLowerCase()));
    const matchType = filterType === 'all' || t.type === filterType;
    const matchCat = filterCat === 'all' || t.category === filterCat;
    return matchText && matchType && matchCat;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="txn">
      <div className="txn__header">
        <h2>Transaction Manager</h2>
        <p>Add, edit, delete and import your income &amp; expense transactions.</p>
      </div>

      {/* Summary */}
      <div className="txn__summary">
        <div className="txn__summary-card glass-card glow-emerald">
          <ArrowUpCircle size={20} color="#10b981" />
          <div>
            <span className="txn__summary-label">Total Income</span>
            <span className="txn__summary-value" style={{ color: '#10b981' }}>₹{totalIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="txn__summary-card glass-card glow-rose">
          <ArrowDownCircle size={20} color="#f43f5e" />
          <div>
            <span className="txn__summary-label">Total Expenses</span>
            <span className="txn__summary-value" style={{ color: '#f43f5e' }}>₹{totalExpense.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="txn__summary-card glass-card glow-purple">
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>=</span>
          </div>
          <div>
            <span className="txn__summary-label">Net Savings</span>
            <span className="txn__summary-value" style={{ color: totalIncome - totalExpense >= 0 ? '#10b981' : '#f43f5e' }}>
              ₹{(totalIncome - totalExpense).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      <div className="glass-card txn__add-card animate-fade">
        <h3>Add Transaction</h3>
        {error && <div className="txn__error">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}
        <form className="txn__form" onSubmit={handleAddTransaction}>
          <div className="txn__form-row">
            <div className="txn__field">
              <label>Type</label>
              <div className="txn__type-toggle">
                <button type="button" className={form.type === 'expense' ? 'active expense' : ''}
                  onClick={() => setForm(f => ({ ...f, type: 'expense' }))}>
                  <ArrowDownCircle size={14} /> Expense
                </button>
                <button type="button" className={form.type === 'income' ? 'active income' : ''}
                  onClick={() => setForm(f => ({ ...f, type: 'income' }))}>
                  <ArrowUpCircle size={14} /> Income
                </button>
              </div>
            </div>
            <div className="txn__field">
              <label htmlFor="txn-amount">Amount (₹)</label>
              <input id="txn-amount" type="number" min="1" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div className="txn__field">
              <label htmlFor="txn-category">Category</label>
              <select id="txn-category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="txn__form-row">
            <div className="txn__field txn__field--grow">
              <label htmlFor="txn-desc">Description</label>
              <input id="txn-desc" type="text" placeholder="e.g. Swiggy Order, Salary, Amazon..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="txn__field">
              <label htmlFor="txn-upi">UPI Reference (optional)</label>
              <input id="txn-upi" type="text" placeholder="For duplicate detection"
                value={form.upiRef} onChange={e => setForm(f => ({ ...f, upiRef: e.target.value }))} />
            </div>
            <div className="txn__field">
              <label htmlFor="txn-date">Date</label>
              <input id="txn-date" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="txn__form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <PlusCircle size={16} /> {submitting ? 'Adding...' : 'Add Transaction'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowImport(!showImport)}>
              <Upload size={16} /> Import UPI
            </button>
            <button type="button" className="btn btn-ghost" onClick={fetchTransactions}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </form>
      </div>

      {/* UPI Import Panel */}
      {showImport && (
        <div className="glass-card txn__import-card animate-fade">
          <h3>📲 UPI Statement Import</h3>
          <p>Paste your UPI transactions as a JSON array. Duplicates (same UPI reference) are automatically skipped.</p>
          <div className="txn__import-example">
            <code>{`[{"amount":450,"category":"food","type":"expense","description":"Swiggy","upiRef":"UPI123456","date":"2026-03-13"}]`}</code>
          </div>
          <textarea className="txn__import-textarea" placeholder="Paste JSON array here..."
            value={importText} onChange={e => setImportText(e.target.value)} rows={6} />
          {importResult && (
            <div className="txn__import-result">
              ✅ Imported: <strong>{importResult.inserted}</strong> new | ⚠️ Duplicates skipped: <strong>{importResult.duplicates}</strong> | Total: <strong>{importResult.total}</strong>
            </div>
          )}
          <button className="btn btn-primary" onClick={handleUpiImport} disabled={importing || !importText.trim()}>
            <Upload size={16} /> {importing ? 'Importing...' : 'Import Transactions'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="txn__filters glass-card">
        <div className="txn__search">
          <Search size={16} />
          <input type="text" placeholder="Search transactions..." value={searchText}
            onChange={e => setSearchText(e.target.value)} />
        </div>
        <div className="txn__filter-group">
          <Filter size={14} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <span className="txn__count">{filtered.length} transactions</span>
      </div>

      {/* Transaction List */}
      <div className="txn__list glass-card">
        {loading ? (
          <div className="txn__empty">Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="txn__empty">
            {transactions.length === 0
              ? '📭 No transactions yet. Add your first income or expense above!'
              : '🔍 No transactions match your filters.'}
          </div>
        ) : (
          <div className="txn__table-wrapper">
            <table className="txn__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const cat = CATEGORY_MAP[tx.category];
                  const isEditing = editId === tx.id;
                  return (
                    <tr key={tx.id} className={`txn__row ${tx.isAnomaly ? 'txn__row--anomaly' : ''}`}>
                      {isEditing ? (
                        <>
                          <td><input type="date" value={editForm.date}
                            onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="txn__edit-input" /></td>
                          <td><input type="text" value={editForm.description}
                            onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="txn__edit-input" /></td>
                          <td>
                            <select value={editForm.category}
                              onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className="txn__edit-input">
                              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>
                          <td>
                            <select value={editForm.type}
                              onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className="txn__edit-input">
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </td>
                          <td><input type="number" value={editForm.amount}
                            onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="txn__edit-input" /></td>
                          <td className="txn__actions">
                            <button className="txn__btn txn__btn--save" onClick={() => saveEdit(tx.id)}><Check size={14} /></button>
                            <button className="txn__btn txn__btn--cancel" onClick={() => setEditId(null)}><X size={14} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="txn__date">{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                          <td className="txn__desc">
                            <span>{tx.description || '—'}</span>
                            {tx.upiRef && <span className="txn__upi-badge">UPI</span>}
                            {tx.isAnomaly ? <span className="txn__anomaly-badge">⚠️ Large</span> : null}
                          </td>
                          <td>
                            <span className="txn__cat-badge" style={{ background: (cat?.color || '#64748b') + '22', color: cat?.color || '#64748b' }}>
                              {cat?.emoji} {cat?.name || tx.category}
                            </span>
                          </td>
                          <td>
                            <span className={`txn__type-badge txn__type-badge--${tx.type}`}>
                              {tx.type === 'income' ? '▲' : '▼'} {tx.type}
                            </span>
                          </td>
                          <td className={`txn__amount txn__amount--${tx.type}`}>
                            {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="txn__actions">
                            <button className="txn__btn txn__btn--edit" onClick={() => startEdit(tx)}><Edit3 size={14} /></button>
                            <button className="txn__btn txn__btn--delete" onClick={() => handleDelete(tx.id)}><Trash2 size={14} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
