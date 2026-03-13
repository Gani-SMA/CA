import { useEffect, useRef, useState, useCallback } from 'react';
import { BarChart3, RefreshCw, TrendingUp, Landmark, LineChart, Plus, Trash2, Edit3, Check, X, Settings } from 'lucide-react';
import * as d3 from 'd3';
import { PROFILE_TYPES, RISK_LEVELS, API_BASE } from '../data/constants';
import './InvestmentPortfolio.css';

function Sparkline({ data, color, width = 120, height = 40 }) {
  const svgRef = useRef();
  useEffect(() => {
    if (!svgRef.current || !data || data.length < 2) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([2, width - 2]);
    const yScale = d3.scaleLinear().domain([d3.min(data) * 0.95, d3.max(data) * 1.05]).range([height - 2, 2]);
    const line = d3.line().x((d, i) => xScale(i)).y(d => yScale(d)).curve(d3.curveMonotoneX);
    const area = d3.area().x((d, i) => xScale(i)).y0(height).y1(d => yScale(d)).curve(d3.curveMonotoneX);
    const defs = svg.append('defs');
    const gradientId = `sg-${Math.random().toString(36).slice(2)}`;
    const gradient = defs.append('linearGradient').attr('id', gradientId).attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);
    svg.append('path').datum(data).attr('d', area).attr('fill', `url(#${gradientId})`);
    svg.append('path').datum(data).attr('d', line).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
    svg.append('circle').attr('cx', xScale(data.length - 1)).attr('cy', yScale(data[data.length - 1])).attr('r', 3).attr('fill', color);
  }, [data, color, width, height]);
  return <svg ref={svgRef} width={width} height={height} aria-label="Performance trend" />;
}

const TYPE_ICONS = {
  'Mutual Fund': BarChart3, 'SIP': RefreshCw, 'Stock': TrendingUp,
  'Savings Scheme': Landmark, 'ETF': LineChart, 'Other': BarChart3,
};

const EMPTY_INV = { name: '', type: 'Mutual Fund', invested: '', currentValue: '', notes: '' };

export default function InvestmentPortfolio() {
  const [investments, setInvestments] = useState([]);
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [profile, setProfile] = useState({ profileType: 'employee', riskLevel: 'medium' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [form, setForm] = useState(EMPTY_INV);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchInvestments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/investments`);
      const data = await res.json();
      setInvestments(Array.isArray(data) ? data : []);
    } catch (e) {}
  }, []);

  const fetchPlan = useCallback(async () => {
    setPlanLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/investment-plan`);
      const data = await res.json();
      setPlan(data);
    } catch (e) { setPlan(null); }
    finally { setPlanLoading(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`);
      const data = await res.json();
      setProfile(data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchInvestments();
    fetchPlan();
    fetchProfile();
  }, [fetchInvestments, fetchPlan, fetchProfile]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/investments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, invested: parseFloat(form.invested), currentValue: parseFloat(form.currentValue) || parseFloat(form.invested) }),
      });
      setForm(EMPTY_INV);
      setShowAddForm(false);
      await fetchInvestments();
    } catch (e) {}
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this investment?')) return;
    await fetch(`${API_BASE}/api/investments/${id}`, { method: 'DELETE' });
    await fetchInvestments();
  };

  const handleSaveEdit = async (id) => {
    await fetch(`${API_BASE}/api/investments/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, invested: parseFloat(editForm.invested), currentValue: parseFloat(editForm.currentValue) }),
    });
    setEditId(null);
    await fetchInvestments();
  };

  const handleSaveProfile = async () => {
    try {
      await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setShowProfilePanel(false);
      await fetchPlan();
    } catch (e) {}
  };

  const totalInvested = investments.reduce((s, i) => s + (i.invested || 0), 0);
  const totalCurrent = investments.reduce((s, i) => s + (i.currentValue || i.invested || 0), 0);
  const totalReturns = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(1) : '0.0';
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="invest">
      <div className="invest__header">
        <div>
          <h2>Investment Portfolio</h2>
          <p>AI-powered personalized investment plan + manually track your real investments.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setShowProfilePanel(!showProfilePanel)}>
            <Settings size={14} /> Profile
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} /> Add Investment
          </button>
        </div>
      </div>

      {/* Profile Panel */}
      {showProfilePanel && (
        <div className="glass-card invest__profile-panel animate-fade">
          <h3>🧠 Your Investment Profile</h3>
          <div className="invest__profile-row">
            <div className="invest__profile-field">
              <label>Profile Type</label>
              <select value={profile.profileType} onChange={e => setProfile(p => ({ ...p, profileType: e.target.value }))}>
                {PROFILE_TYPES.map(pt => <option key={pt.id} value={pt.id}>{pt.emoji} {pt.label}</option>)}
              </select>
            </div>
            <div className="invest__profile-field">
              <label>Risk Level</label>
              <select value={profile.riskLevel} onChange={e => setProfile(p => ({ ...p, riskLevel: e.target.value }))}>
                {RISK_LEVELS.map(r => <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleSaveProfile}>✓ Save & Regenerate Plan</button>
            <button className="btn btn-ghost" onClick={() => setShowProfilePanel(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Investment Form */}
      {showAddForm && (
        <div className="glass-card invest__add-form animate-fade">
          <h3>➕ Track an Investment</h3>
          <form onSubmit={handleAdd}>
            <div className="invest__form-row">
              <div className="invest__form-field">
                <label>Name</label>
                <input type="text" placeholder="e.g. HDFC Mid Cap Fund" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="invest__form-field">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.keys(TYPE_ICONS).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="invest__form-field">
                <label>Amount Invested (₹)</label>
                <input type="number" min="1" placeholder="0" value={form.invested}
                  onChange={e => setForm(f => ({ ...f, invested: e.target.value }))} required />
              </div>
              <div className="invest__form-field">
                <label>Current Value (₹)</label>
                <input type="number" min="0" placeholder="Same as invested if new"
                  value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '...' : '✓ Add'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Real Investments Summary */}
      {investments.length > 0 && (
        <>
          <div className="invest__summary">
            <div className="glass-card invest__summary-card glow-purple animate-slide-up stagger-1">
              <span className="invest__summary-label">Total Invested</span>
              <span className="invest__summary-value">₹{totalInvested.toLocaleString('en-IN')}</span>
            </div>
            <div className="glass-card invest__summary-card glow-emerald animate-slide-up stagger-2">
              <span className="invest__summary-label">Current Value</span>
              <span className="invest__summary-value" style={{ color: '#10b981' }}>₹{totalCurrent.toLocaleString('en-IN')}</span>
            </div>
            <div className="glass-card invest__summary-card glow-cyan animate-slide-up stagger-3">
              <span className="invest__summary-label">Total Returns</span>
              <span className="invest__summary-value" style={{ color: parseFloat(totalReturns) >= 0 ? '#06b6d4' : '#f43f5e' }}>
                {parseFloat(totalReturns) >= 0 ? '+' : ''}{totalReturns}%
              </span>
            </div>
          </div>

          <div className="invest__cards-wrapper">
            <div className="invest__cards">
              {investments.map((inv, i) => {
                const returnAmt = (inv.currentValue || inv.invested) - inv.invested;
                const returnPct = inv.invested > 0 ? ((returnAmt / inv.invested) * 100).toFixed(1) : '0.0';
                const color = COLORS[i % COLORS.length];
                const TypeIcon = TYPE_ICONS[inv.type] || BarChart3;
                return (
                  <div key={inv.id} className="invest__card glass-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                    {editId === inv.id ? (
                      <div className="invest__edit-form">
                        <input className="invest__edit-input" placeholder="Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                        <input className="invest__edit-input" placeholder="Invested ₹" type="number" value={editForm.invested} onChange={e => setEditForm(f => ({ ...f, invested: e.target.value }))} />
                        <input className="invest__edit-input" placeholder="Current ₹" type="number" value={editForm.currentValue} onChange={e => setEditForm(f => ({ ...f, currentValue: e.target.value }))} />
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                          <button className="txn__btn txn__btn--save" onClick={() => handleSaveEdit(inv.id)}><Check size={13} /></button>
                          <button className="txn__btn txn__btn--cancel" onClick={() => setEditId(null)}><X size={13} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="invest__card-header">
                          <div className="invest__card-icon" style={{ background: color + '22', color }}>
                            <TypeIcon size={18} strokeWidth={1.8} />
                          </div>
                          <span className="invest__card-type" style={{ color }}>{inv.type}</span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
                            <button className="txn__btn txn__btn--edit" onClick={() => { setEditId(inv.id); setEditForm({ name: inv.name, type: inv.type, invested: inv.invested, currentValue: inv.currentValue }); }}><Edit3 size={12} /></button>
                            <button className="txn__btn txn__btn--delete" onClick={() => handleDelete(inv.id)}><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <h4 className="invest__card-name">{inv.name}</h4>
                        <div className="invest__card-chart">
                          <Sparkline data={[inv.invested, (inv.currentValue || inv.invested)]} color={color} width={200} height={60} />
                        </div>
                        <div className="invest__card-stats">
                          <div className="invest__card-stat">
                            <span className="invest__card-stat-label">Invested</span>
                            <span className="invest__card-stat-value">₹{inv.invested.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="invest__card-stat">
                            <span className="invest__card-stat-label">Current</span>
                            <span className="invest__card-stat-value" style={{ color: '#10b981' }}>₹{(inv.currentValue || inv.invested).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="invest__card-stat">
                            <span className="invest__card-stat-label">Returns</span>
                            <span className="invest__card-stat-value" style={{ color: returnAmt >= 0 ? color : '#f43f5e' }}>
                              {returnAmt >= 0 ? '+' : ''}₹{Math.abs(returnAmt).toLocaleString('en-IN')} ({returnPct}%)
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* AI Investment Plan */}
      <div className="invest__ai-plan glass-card animate-fade">
        <div className="invest__ai-plan-header">
          <div>
            <h3>🤖 AI Investment Plan</h3>
            <p>Personalized for your profile: <strong style={{ color: '#8b5cf6' }}>
              {PROFILE_TYPES.find(p => p.id === profile.profileType)?.label || 'Employee'}
            </strong> · Risk: <strong style={{ color: '#06b6d4' }}>
              {RISK_LEVELS.find(r => r.id === profile.riskLevel)?.label || 'Moderate'}
            </strong></p>
          </div>
          <button className="btn btn-ghost" onClick={fetchPlan} disabled={planLoading}>
            <RefreshCw size={13} /> Regenerate
          </button>
        </div>

        {planLoading ? (
          <div className="invest__ai-loading">
            <div className="thinking-dots"><span /><span /><span /></div>
            <p>Generating your personalized plan with Gemini AI...</p>
          </div>
        ) : !plan ? (
          <p style={{ color: '#64748b' }}>Could not load AI plan. Please add your income in the Dashboard and ensure GEMINI_API_KEY is set.</p>
        ) : (
          <div className="invest__plan-content">
            {plan.summary && <p className="invest__plan-summary">{plan.summary}</p>}
            
            {plan.recommendations && plan.recommendations.length > 0 && (
              <div className="invest__plan-recs">
                <h4>Recommended Allocation</h4>
                <div className="invest__recs-grid">
                  {plan.recommendations.map((rec, i) => (
                    <div key={rec.id || i} className="invest__rec-card glass-card" style={{ '--rec-color': COLORS[i % COLORS.length] }}>
                      <div className="invest__rec-header">
                        <span className="invest__rec-cat">{rec.category}</span>
                        {rec.allocation > 0 && (
                          <span className="invest__rec-amount">₹{rec.allocation.toLocaleString('en-IN')}/{rec.type === 'monthly SIP' ? 'mo' : 'once'}</span>
                        )}
                      </div>
                      <h5 className="invest__rec-name">{rec.name}</h5>
                      <p className="invest__rec-rationale">{rec.rationale}</p>
                      {rec.returns && <span className="invest__rec-returns">Expected: {rec.returns}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.healthInsurance && (
              <div className="invest__health-card glass-card">
                <h4>🏥 Recommended Health Insurance</h4>
                <div className="invest__health-grid">
                  <div><label>Product</label><span>{plan.healthInsurance.recommended}</span></div>
                  <div><label>Coverage</label><span>{plan.healthInsurance.coverAmount}</span></div>
                  <div><label>Premium</label><span>{plan.healthInsurance.monthlyPremium}/month</span></div>
                  <div><label>Features</label><span>{plan.healthInsurance.features}</span></div>
                </div>
              </div>
            )}

            {plan.taxSaving && (
              <div className="invest__tax-card glass-card">
                <h4>💰 Tax Saving Strategies</h4>
                <div className="invest__tax-grid">
                  {plan.taxSaving.section80C && <div><label>Section 80C</label><span>{plan.taxSaving.section80C}</span></div>}
                  {plan.taxSaving.section80D && <div><label>Section 80D</label><span>{plan.taxSaving.section80D}</span></div>}
                  {plan.taxSaving.otherDeductions && <div><label>Other</label><span>{plan.taxSaving.otherDeductions}</span></div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
