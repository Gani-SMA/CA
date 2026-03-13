import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  LayoutDashboard, Orbit, TreePine, AlertTriangle, TrendingUp,
  ChevronLeft, ChevronRight, Gem, Receipt
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/galaxy', icon: Orbit, label: 'Expense Galaxy' },
  { path: '/savings', icon: TreePine, label: 'Growth Grove' },
  { path: '/alerts', icon: AlertTriangle, label: 'SOS Alerts' },
  { path: '/investments', icon: TrendingUp, label: 'Investments' },
];

export default function Sidebar({ collapsed, onToggle, isOpen, onClose }) {
  const location = useLocation();
  const { user } = useUser();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      
      <aside 
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${isOpen ? 'sidebar--mobile-open' : ''}`} 
        role="navigation" 
        aria-label="Main navigation"
      >
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <Gem size={20} strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="sidebar__logo-text">
            <h3>FinAdvisor</h3>
            <span>AI Finance</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={() => {
                if (isOpen && onClose) onClose();
              }}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={1.8} className="sidebar__link-icon" />
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
              {location.pathname === item.path && <div className="sidebar__link-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User Card */}
      {!collapsed && user && (
        <div className="sidebar__user glass-card">
          <img 
            src={user.imageUrl} 
            alt={user.fullName || "User"} 
            className="sidebar__avatar" 
          />
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">
              {user.fullName || user.primaryEmailAddress?.emailAddress || "Investor"}
            </span>
            <span className="sidebar__user-balance">{user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'FinAdvisor'}</span>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button className="sidebar__toggle" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
    </>
  );
}
