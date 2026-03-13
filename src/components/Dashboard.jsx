import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Wallet, ArrowDownRight, PiggyBank, Percent,
  Utensils, Target, BarChart3, Coins
} from 'lucide-react';
import { CATEGORIES, AI_SUGGESTIONS } from '../data/mockData';
import './Dashboard.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const SUGGESTION_ICONS = [Utensils, Target, BarChart3, Coins];

// Category icon mapping
import { Car, Zap, ShoppingBag, Gamepad2, HeartPulse, TrendingUp, UtensilsCrossed } from 'lucide-react';
const CAT_ICONS = {
  food: UtensilsCrossed, transport: Car, bills: Zap, shopping: ShoppingBag,
  entertainment: Gamepad2, healthcare: HeartPulse, investment: TrendingUp,
};

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalSpent: 0,
    currentSavings: 0,
    savingsRate: 0
  });

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoaded(true);
      })
      .catch(err => {
        console.error("Failed to load dashboard stats", err);
        setLoaded(true);
      });
  }, []);

  const spendingData = {
    labels: CATEGORIES.map(c => c.name).filter((_, i) => (stats.spendingByCategory?.[CATEGORIES[i].id] || 0) > 0),
    datasets: [{
      data: CATEGORIES.map(c => stats.spendingByCategory?.[c.id] || 0).filter(v => v > 0),
      backgroundColor: CATEGORIES.map(c => c.color).filter((_, i) => (stats.spendingByCategory?.[CATEGORIES[i].id] || 0) > 0),
      borderColor: 'rgba(10,14,26,0.8)',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const trendsData = {
    labels: (stats.monthlyTrends || []).map(m => m.month),
    datasets: [
      {
        label: 'Income',
        data: (stats.monthlyTrends || []).map(m => m.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
      },
      {
        label: 'Expenses',
        data: (stats.monthlyTrends || []).map(m => m.expense),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244,63,94,0.1)',
        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
      },
      {
        label: 'Savings',
        data: (stats.monthlyTrends || []).map(m => m.savings),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.1)',
        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
      },
    ],
  };



  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', padding: 15, usePointStyle: true, pointStyleWidth: 10, font: { size: 11, family: 'Inter' } },
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#f0f4ff', bodyColor: '#94a3b8',
        borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1,
        padding: 12, cornerRadius: 8,
        titleFont: { family: 'Outfit', weight: '600' },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed?.y?.toLocaleString('en-IN') || ctx.parsed?.toLocaleString('en-IN') || ctx.raw?.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.06)' } },
      y: {
        ticks: { color: '#64748b', font: { size: 11 }, callback: (val) => `₹${(val/1000).toFixed(0)}k` },
        grid: { color: 'rgba(148,163,184,0.06)' },
      },
    },
  };

  const pctUsed = stats.totalIncome > 0 ? Math.round((stats.totalSpent / stats.totalIncome) * 100) : 0;

  const statCards = [
    { label: 'Monthly Income', value: stats.totalIncome, icon: Wallet, gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', glow: 'glow-purple' },
    { label: 'Total Expenses', value: stats.totalSpent, icon: ArrowDownRight, gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)', glow: 'glow-rose' },
    { label: 'Savings', value: stats.currentSavings, icon: PiggyBank, gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'glow-emerald' },
    { label: 'Savings Rate', value: null, display: `${stats.savingsRate}%`, icon: Percent, gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)', glow: 'glow-cyan' },
  ];

  return (
    <div className={`dashboard ${loaded ? 'dashboard--loaded' : ''}`}>
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
                  {card.display || `₹${card.value.toLocaleString('en-IN')}`}
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
          <div className="dashboard__doughnut-wrapper">
            <Doughnut
              data={spendingData}
              options={{
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: {
                  legend: { position: 'right', labels: { color: '#94a3b8', padding: 10, usePointStyle: true, font: { size: 11, family: 'Inter' } } },
                  tooltip: chartOptions.plugins.tooltip,
                },
              }}
            />
            <div className="dashboard__doughnut-center">
              <span className="dashboard__doughnut-pct">{pctUsed}%</span>
              <span className="dashboard__doughnut-label">Budget Used</span>
            </div>
          </div>
        </div>

        <div className="glass-card dashboard__chart-card dashboard__chart-card--wide animate-fade stagger-3">
          <h3>Monthly Trends</h3>
          <div className="dashboard__chart-container">
            <Line data={trendsData} options={chartOptions} />
          </div>
        </div>


        {/* AI Suggestions */}
        <div className="glass-card dashboard__suggestions animate-fade stagger-5">
          <div className="dashboard__section-header">
            <h3>AI Suggestions</h3>
            <span className="dashboard__section-badge">Powered by ML</span>
          </div>
          <div className="suggestions-list">
            {AI_SUGGESTIONS.map((s, i) => {
              const Icon = SUGGESTION_ICONS[i];
              return (
                <div key={s.id} className="suggestion-item" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                  <div className="suggestion-icon-wrap">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <div className="suggestion-content">
                    <strong>{s.title}</strong>
                    <p>{s.text}</p>
                  </div>
                  <span className="suggestion-impact">{s.impact}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
}
