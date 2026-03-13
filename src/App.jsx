import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Bot, X } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExpenseGalaxy from './components/ExpenseGalaxy';
import GrowthGrove from './components/GrowthGrove';
import SOSAlerts from './components/SOSAlerts';
import InvestmentPortfolio from './components/InvestmentPortfolio';
import TransactionManager from './components/TransactionManager';
import ChatDrawer from './components/ChatDrawer';
import LiquidBackground from './components/LiquidBackground';
import LandingPage from './components/LandingPage';
import './App.css';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/galaxy': 'Expense Galaxy',
  '/savings': 'Growth Grove',
  '/alerts': 'SOS Alerts',
  '/investments': 'Investments',
  '/transactions': 'Transactions',
};

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';
  
  // Decide the accent hue based on the theme and page for variation
  let targetHue = theme === 'dark' ? 260 : 200; // Purple-blue for dark, cyan-blue for light
  if (location.pathname === '/alerts') targetHue = theme === 'dark' ? 340 : 10; // Red/Amber hue for alerts
  if (location.pathname === '/savings') targetHue = theme === 'dark' ? 140 : 160; // Greenish for savings

  return (
    <div className="app-layout">
      {/* Liquid WebGL Background */}
      <LiquidBackground hueTarget={targetHue} speed={0.8} complexity={0.8} />

      <SignedOut>
        {/* Unauthenticated User Flow */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SignedOut>

      <SignedIn>
        {/* Authenticated User Flow */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <main className={`main-content ${sidebarCollapsed ? 'main-content--expanded' : ''}`}>
          <Header
            title={title}
            language={language}
            onLanguageChange={setLanguage}
            onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/galaxy" element={<ExpenseGalaxy />} />
              <Route path="/savings" element={<GrowthGrove />} />
              <Route path="/alerts" element={<SOSAlerts />} />
              <Route path="/investments" element={<InvestmentPortfolio />} />
              <Route path="/transactions" element={<TransactionManager />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>

        <button
          className={`chat-fab ${chatOpen ? 'chat-fab--active' : ''}`}
          onClick={() => setChatOpen(!chatOpen)}
          aria-label={chatOpen ? 'Close AI Financial Coach' : 'Open AI Financial Coach'}
        >
          <span className="chat-fab__icon">
            {chatOpen ? <X size={20} strokeWidth={2} /> : <Bot size={22} strokeWidth={1.8} />}
          </span>
          {!chatOpen && <span className="chat-fab__pulse" />}
        </button>

        <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} language={language} />
      </SignedIn>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
