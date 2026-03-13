import { useState } from 'react';
import { Shield, Zap, Gem, X, ChevronRight, RotateCcw } from 'lucide-react';
import { SOS_ALERTS } from '../data/mockData';
import './SOSAlerts.css';

const COLOR_MAP = {
  cyan: {
    bg: 'rgba(6, 182, 212, 0.06)',
    border: 'rgba(6, 182, 212, 0.25)',
    glow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    iconBg: 'rgba(6, 182, 212, 0.15)',
    Icon: Shield,
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.06)',
    border: 'rgba(245, 158, 11, 0.25)',
    glow: '0 0 30px rgba(245, 158, 11, 0.2), inset 0 0 30px rgba(245, 158, 11, 0.05)',
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    Icon: Zap,
  },
  emerald: {
    bg: 'rgba(16, 185, 129, 0.06)',
    border: 'rgba(16, 185, 129, 0.25)',
    glow: '0 0 30px rgba(16, 185, 129, 0.2), inset 0 0 30px rgba(16, 185, 129, 0.05)',
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    Icon: Gem,
  },
};

export default function SOSAlerts() {
  const [dismissed, setDismissed] = useState([]);

  return (
    <div className="sos">
      <div className="sos__header">
        <h2>SOS Financial Alerts</h2>
        <p>Proactive alerts to protect your financial health and identify opportunities.</p>
      </div>

      <div className="sos__grid">
        {SOS_ALERTS.filter(a => !dismissed.includes(a.type)).map((alert, i) => {
          const colors = COLOR_MAP[alert.color];
          const AlertIcon = colors.Icon;
          return (
            <div
              key={alert.type}
              className="sos__card"
              style={{
                '--sos-bg': colors.bg,
                '--sos-border': colors.border,
                '--sos-glow': colors.glow,
                '--sos-accent': colors.accent,
                animationDelay: `${i * 0.15}s`,
              }}
              role="alert"
            >
              <div className="sos__ambient" style={{ background: colors.accent }} />
              <div className="sos__card-inner">
                <div className="sos__card-top">
                  <div className="sos__icon" style={{ background: colors.iconBg, color: colors.accent }}>
                    <AlertIcon size={22} strokeWidth={1.8} />
                  </div>
                  <div className="sos__severity-badge" style={{ background: colors.iconBg, color: colors.accent }}>
                    {alert.severity === 'high' ? 'High Priority' : alert.severity === 'medium' ? 'Medium' : 'Opportunity'}
                  </div>
                </div>

                <h3 className="sos__title" style={{ color: colors.accent }}>{alert.title}</h3>
                <p className="sos__message">{alert.message}</p>

                <div className="sos__actions">
                  <button className="sos__action-btn" style={{ background: colors.gradient }}>
                    {alert.action}
                    <ChevronRight size={16} strokeWidth={2} />
                  </button>
                  <button
                    className="sos__dismiss-btn"
                    onClick={() => setDismissed([...dismissed, alert.type])}
                    aria-label={`Dismiss ${alert.title}`}
                  >
                    <X size={14} /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dismissed.length > 0 && (
        <button className="sos__reset btn btn-ghost" onClick={() => setDismissed([])}>
          <RotateCcw size={14} /> Show all alerts ({dismissed.length} dismissed)
        </button>
      )}

      <div className="sos__info glass-card">
        <h3>How SOS Alerts Work</h3>
        <div className="sos__info-grid">
          <div className="sos__info-item">
            <span className="sos__info-dot" style={{ background: '#06b6d4' }} />
            <div>
              <strong>Saving SOS</strong>
              <p>Triggered when your saving rate drops below the safe level of 25%.</p>
            </div>
          </div>
          <div className="sos__info-item">
            <span className="sos__info-dot" style={{ background: '#f59e0b' }} />
            <div>
              <strong>Expenditure SOS</strong>
              <p>Triggered when spending in any category exceeds the defined monthly limit.</p>
            </div>
          </div>
          <div className="sos__info-item">
            <span className="sos__info-dot" style={{ background: '#10b981' }} />
            <div>
              <strong>Investment Opportunity</strong>
              <p>Triggered when surplus funds are detected with personalized investment suggestions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
