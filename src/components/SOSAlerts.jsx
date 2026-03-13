import { useState, useEffect, useCallback } from 'react';
import { Shield, Zap, Gem, X, ChevronRight, RotateCcw, Bell, BellOff, AlertTriangle, Info } from 'lucide-react';
import { API_BASE } from '../data/constants';
import './SOSAlerts.css';

const COLOR_MAP = {
  cyan: {
    bg: 'rgba(6, 182, 212, 0.06)', border: 'rgba(6, 182, 212, 0.25)',
    glow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)',
    accent: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    iconBg: 'rgba(6, 182, 212, 0.15)', Icon: Shield,
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.25)',
    glow: '0 0 30px rgba(245, 158, 11, 0.2), inset 0 0 30px rgba(245, 158, 11, 0.05)',
    accent: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    iconBg: 'rgba(245, 158, 11, 0.15)', Icon: Zap,
  },
  emerald: {
    bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.25)',
    glow: '0 0 30px rgba(16, 185, 129, 0.2), inset 0 0 30px rgba(16, 185, 129, 0.05)',
    accent: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)',
    iconBg: 'rgba(16, 185, 129, 0.15)', Icon: Gem,
  },
};

export default function SOSAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/alerts`);
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);

      // Trigger browser notification for high-severity alerts
      if (notifyEnabled && Array.isArray(data)) {
        const highAlerts = data.filter(a => a.severity === 'high');
        highAlerts.forEach(alert => {
          if (Notification.permission === 'granted') {
            new Notification(`🚨 ${alert.title}`, {
              body: alert.message,
              icon: '/favicon.ico',
            });
          }
        });
      }
    } catch (e) {
      console.error('Failed to load alerts', e);
    } finally {
      setLoading(false);
    }
  }, [notifyEnabled]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications not supported in this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifyEnabled(true);
      new Notification('✅ SOS Alerts Enabled', {
        body: 'You will now receive browser notifications for high-priority financial alerts.',
        icon: '/favicon.ico',
      });
    }
  };

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  return (
    <div className="sos">
      <div className="sos__header">
        <div>
          <h2>SOS Financial Alerts</h2>
          <p>Real-time alerts based on your actual income, expenses, and budget limits.</p>
        </div>
        <div className="sos__header-actions">
          <button
            className={`btn ${notifyEnabled ? 'btn-ghost' : 'btn-primary'}`}
            onClick={notifyEnabled ? () => setNotifyEnabled(false) : requestNotificationPermission}
          >
            {notifyEnabled ? <><BellOff size={15} /> Notifications On</> : <><Bell size={15} /> Enable Notifications</>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="sos__loading glass-card">
          <div className="thinking-dots"><span /><span /><span /></div>
          <p>Analyzing your financial data...</p>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="sos__all-clear glass-card animate-fade">
          <span className="sos__all-clear-icon">✅</span>
          <h3>All Clear!</h3>
          <p>
            {alerts.length === 0
              ? 'No alerts detected. Add income and expense transactions to enable smart alerts.'
              : `All ${alerts.length} alert(s) dismissed. Financial health looks good!`}
          </p>
          {dismissed.length > 0 && (
            <button className="btn btn-ghost" onClick={() => setDismissed([])}>
              <RotateCcw size={14} /> Show dismissed alerts
            </button>
          )}
        </div>
      ) : (
        <div className="sos__grid">
          {visibleAlerts.map((alert, i) => {
            const colors = COLOR_MAP[alert.color] || COLOR_MAP.cyan;
            const AlertIcon = alert.severity === 'high' ? AlertTriangle :
                              alert.severity === 'low' ? colors.Icon :
                              alert.type === 'info' ? Info : colors.Icon;
            return (
              <div
                key={alert.id}
                className="sos__card"
                style={{
                  '--sos-bg': colors.bg, '--sos-border': colors.border,
                  '--sos-glow': colors.glow, '--sos-accent': colors.accent,
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
                      {alert.severity === 'high' ? '🔴 High Priority'
                        : alert.severity === 'medium' ? '🟡 Medium'
                        : alert.type === 'info' ? 'ℹ️ Info'
                        : '🟢 Opportunity'}
                    </div>
                  </div>
                  <h3 className="sos__title" style={{ color: colors.accent }}>{alert.title}</h3>
                  <p className="sos__message">{alert.message}</p>
                  <div className="sos__actions">
                    <button className="sos__action-btn" style={{ background: colors.gradient }}>
                      {alert.action} <ChevronRight size={16} strokeWidth={2} />
                    </button>
                    <button className="sos__dismiss-btn" onClick={() => setDismissed(d => [...d, alert.id])}
                      aria-label={`Dismiss ${alert.title}`}>
                      <X size={14} /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dismissed.length > 0 && visibleAlerts.length > 0 && (
        <button className="sos__reset btn btn-ghost" onClick={() => setDismissed([])}>
          <RotateCcw size={14} /> Show all alerts ({dismissed.length} dismissed)
        </button>
      )}

      <div className="sos__info glass-card">
        <h3>How SOS Alerts Work</h3>
        <div className="sos__info-grid">
          <div className="sos__info-item">
            <span className="sos__info-dot" style={{ background: '#06b6d4' }} />
            <div><strong>Saving SOS</strong><p>Triggered when your saving rate drops below 20% of income.</p></div>
          </div>
          <div className="sos__info-item">
            <span className="sos__info-dot" style={{ background: '#f59e0b' }} />
            <div><strong>Budget Exceeded</strong><p>Triggered when spending in any category exceeds your set budget limit.</p></div>
          </div>
          <div className="sos__info-item">
            <span className="sos__info-dot" style={{ background: '#f43f5e' }} />
            <div><strong>Large Transaction</strong><p>Triggered for any single transaction above ₹50,000 for verification.</p></div>
          </div>
          <div className="sos__info-item">
            <span className="sos__info-dot" style={{ background: '#10b981' }} />
            <div><strong>Investment Opportunity</strong><p>Triggered when a surplus is detected — suggesting where to put it to work.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
