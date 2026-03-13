import { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  ArcElement, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Wallet, ArrowDownRight, PiggyBank, Percent,
  Utensils, Target, BarChart3, Coins, TrendingUp, Shield,
  RefreshCw, ChevronRight, Settings
} from 'lucide-react';
import { CATEGORIES, PROFILE_TYPES, RISK_LEVELS, API_BASE } from '../data/constants';
import './Dashboard.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const ICON_MAP = {
  'utensils': Utensils, 'target': Target, 'bar-chart': BarChart3,
  'trending-up': TrendingUp, 'shield': Shield, 'piggy-bank': PiggyBank,
  'coins': Coins,
};

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalIncome: 0, totalSpent: 0, currentSavings: 0, savingsRate: 0,
    spendingByCategory: {}, monthlyTrends: []
  });
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [showIncomeSetup, setShowIncomeSetup] = useState(false);
  const [profile, setProfile] = useState({ monthlyIncome: 0, profileType: 'employee', riskLevel: 'medium' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats`);
      const data = await res.json();
      setStats(data);
      return data;
    } catch (err) { console.error('Failed to load stats', err); }
    finally { setLoaded(true); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`);
      const data = await res.json();
      setProfile(data);
    } catch (e) {}
  }, []);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/insights`);
      const data = await res.json();
      setInsights(Array.isArray(data) ? data : []);
    } catch (e) { setInsights([]); }
    finally { setInsightsLoading(false); }
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchProfile(), fetchInsights()]);
    const interval = setInterval(() => {
      fetchStats();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchProfile, fetchInsights]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setShowIncomeSetup(false);
      await fetchStats();
      await fetchInsights();
    } catch (e) {}
    finally { setSavingProfile(false); }
  };

  const spendingData = {
    labels: CATEGORIES.filter(c => (stats.spendingByCategory?.[c.id] || 0) > 0).map(c => c.name),
    datasets: [{
      data: CATEGORIES.filter(c => (stats.spendingByCategory?.[c.id] || 0) > 0).map(c => stats.spendingByCategory?.[c.id] || 0),
      backgroundColor: CATEGORIES.filter(c => (stats.spendingByCategory?.[c.id] || 0) > 0).map(c => c.color),
      borderColor: 'rgba(10,14,26,0.8)', borderWidth: 3, hoverOffset: 8,
    }],
  };

  const trendsData = {
    labels: (stats.monthlyTrends || []).map(m => m.month),
    datasets: [
      { label: 'Income', data: (stats.monthlyTrends || []).map(m => m.income), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7 },
      { label: 'Expenses', data: (stats.monthlyTrends || []).map(m => m.expense), borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7 },
      { label: 'Savings', data: (stats.monthlyTrends || []).map(m => m.savings), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7 },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', padding: 15, usePointStyle: true, pointStyleWidth: 10, font: { size: 11, family: 'Inter' } } },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#f0f4ff', bodyColor: '#94a3b8',
        borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, padding: 12, cornerRadius: 8,
        titleFont: { family: 'Outfit', weight: '600' }, bodyFont: { family: 'Inter' },
        callbacks: { label: ctx => ` ₹${(ctx.parsed?.y ?? ctx.raw ?? 0).toLocaleString('en-IN')}` },
      },
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.06)' } },
      y: { ticks: { color: '#64748b', font: { size: 11 }, callback: val => `₹${(val / 1000).toFixed(0)}k` }, grid: { color: 'rgba(148,163,184,0.06)' } },
    },
  };

  const pctUsed = stats.totalIncome > 0 ? Math.round((stats.totalSpent / stats.totalIncome) * 100) : 0;
  const hasData = stats.totalIncome > 0 || stats.totalSpent > 0;

  const statCards = [
    { label: 'Monthly Income', value: stats.totalIncome, icon: Wallet, gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', glow: 'glow-purple' },
    { label: 'Total Expenses', value: stats.totalSpent, icon: ArrowDownRight, gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)', glow: 'glow-rose' },
    { label: 'Net Savings', value: stats.currentSavings, icon: PiggyBank, gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'glow-emerald' },
    { label: 'Savings Rate', value: null, display: `${stats.savingsRate}%`, icon: Percent, gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)', glow: 'glow-cyan' },
  ];

  return (
    <div className={`dashboard ${loaded ? 'dashboard--loaded' : ''}`}>

      {/* Profile Setup Banner if no income */}
      {loaded && !hasData && !showIncomeSetup && (
        <div className="dashboard__setup-banner glass-card animate-slide-up">
          <div>
            <h3>👋 Welcome! Let's set up your profile</h3>
            <p>Enter your monthly income and profile type to get personalized insights.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowIncomeSetup(true)}>
            <Settings size={15} /> Set Up Profile
          </button>
        </div>
      )}

      {/* Income / Profile Setup Panel */}
      {showIncomeSetup && (
        <div className="dashboard__profile-panel glass-card animate-fade">
          <h3><Settings size={16} /> Your Financial Profile</h3>
          <div className="dashboard__profile-row">
            <div className="dashboard__profile-field">
              <label>Monthly Income (₹)</label>
              <input type="number" min="0" placeholder="e.g. 75000"
                value={profile.monthlyIncome || ''}
                onChange={e => setProfile(p => ({ ...p, monthlyIncome: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="dashboard__profile-field">
              <label>Profile Type</label>
              <select value={profile.profileType}
                onChange={e => setProfile(p => ({ ...p, profileType: e.target.value }))}>
                {PROFILE_TYPES.map(pt => <option key={pt.id} value={pt.id}>{pt.emoji} {pt.label}</option>)}
              </select>
            </div>
            <div className="dashboard__profile-field">
              <label>Risk Appetite</label>
              <select value={profile.riskLevel}
                onChange={e => setProfile(p => ({ ...p, riskLevel: e.target.value }))}>
                {RISK_LEVELS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="dashboard__profile-actions">
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : '✓ Save Profile'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowIncomeSetup(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="dashboard__stats">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`stat-card glass-card ${card.glow} animate-slide-up stagger-${i + 1}`}>
              <div className="stat-card__icon" style={{ background: card.gradient }}>
                <Icon size={22} strokeWidth={2} color="white" />
              </div>
              <div className="stat-card__info">
                <span className="stat-card__label">{card.label}</span>
                <span className="stat-card__value">
                  {card.display || `₹${(card.value || 0).toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="dashboard__grid">
        <div className="glass-card dashboard__chart-card animate-fade stagger-2">
          <h3>Spending Overview</h3>
          {Object.keys(stats.spendingByCategory || {}).length === 0 ? (
            <div className="dashboard__empty-chart">
              <span>📊</span>
              <p>No expense data yet.<br />Add transactions to see your spending breakdown.</p>
            </div>
          ) : (
            <div className="dashboard__doughnut-wrapper">
              <Doughnut data={spendingData}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 10, usePointStyle: true, font: { size: 11, family: 'Inter' } } }, tooltip: chartOptions.plugins.tooltip } }} />
              <div className="dashboard__doughnut-center">
                <span className="dashboard__doughnut-pct">{pctUsed}%</span>
                <span className="dashboard__doughnut-label">Budget Used</span>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card dashboard__chart-card dashboard__chart-card--wide animate-fade stagger-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Monthly Trends</h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              <RefreshCw size={11} style={{ display: 'inline', marginRight: 4 }} />
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {(stats.monthlyTrends || []).length === 0 ? (
            <div className="dashboard__empty-chart">
              <span>📈</span>
              <p>No trend data yet.<br />Add transactions to see monthly trends.</p>
            </div>
          ) : (
            <div className="dashboard__chart-container">
              <Line data={trendsData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="glass-card dashboard__suggestions animate-fade stagger-5">
          <div className="dashboard__section-header">
            <h3>AI Financial Insights</h3>
            <span className="dashboard__section-badge">Powered by Gemini</span>
          </div>
          <div className="suggestions-list">
            {insightsLoading ? (
              <div className="dashboard__ai-loading">
                <div className="thinking-dots"><span /><span /><span /></div>
                <p>Analyzing your finances...</p>
              </div>
            ) : insights.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No insights available. Add transactions first.</p>
            ) : insights.map((s, i) => {
              const Icon = ICON_MAP[s.icon] || BarChart3;
              return (
                <div key={s.id || i} className="suggestion-item" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                  <div className="suggestion-icon-wrap"><Icon size={18} strokeWidth={1.8} /></div>
                  <div className="suggestion-content">
                    <strong>{s.title}</strong>
                    <p>{s.text}</p>
                  </div>
                  <span className="suggestion-impact">{s.impact}</span>
                </div>
              );
            })}
          </div>
          {!insightsLoading && (
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem' }}
              onClick={fetchInsights}>
              <RefreshCw size={13} /> Refresh AI Insights
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
