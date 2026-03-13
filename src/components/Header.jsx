import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Bell, Sun, Moon } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import './Header.css';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'EN' },
  { code: 'hi', name: 'Hindi', native: 'हि' },
  { code: 'ta', name: 'Tamil', native: 'த' },
  { code: 'te', name: 'Telugu', native: 'తె' },
  { code: 'kn', name: 'Kannada', native: 'ಕ' },
  { code: 'ml', name: 'Malayalam', native: 'മ' },
  { code: 'bn', name: 'Bengali', native: 'বা' },
];

export default function Header({ title, language, onLanguageChange, onMenuToggle, theme, onToggleTheme }) {
  const [langOpen, setLangOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <header className="header" role="banner">
      <div className="header__left">
        <button className="header__menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="header__title-section">
          <h1 className="header__title">{title}</h1>
          <span className="header__subtitle">AI-Powered Financial Intelligence</span>
        </div>
      </div>

      <div className="header__right">
        {/* Search */}
        <div className={`header__search ${searchFocused ? 'header__search--focused' : ''}`}>
          <Search size={16} strokeWidth={2} className="header__search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchValue.trim()) {
                navigate(`/transactions?q=${encodeURIComponent(searchValue.trim())}`);
              }
            }}
            className="header__search-input"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search transactions"
          />
        </div>

        {/* Theme Toggle */}
        <button
          className={`header__theme-toggle ${theme === 'light' ? 'header__theme-toggle--light' : ''}`}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="header__theme-icon header__theme-icon--sun">
            <Sun size={16} strokeWidth={2} />
          </span>
          <span className="header__theme-icon header__theme-icon--moon">
            <Moon size={16} strokeWidth={2} />
          </span>
          <span className="header__theme-slider" />
        </button>

        {/* Language Selector */}
        <div className="header__lang-wrapper">
          <button
            className="header__lang-btn"
            onClick={() => setLangOpen(!langOpen)}
            aria-label="Change language"
            aria-expanded={langOpen}
          >
            <Globe size={16} strokeWidth={2} />
            <span>{currentLang.native}</span>
          </button>
          {langOpen && (
            <div className="header__lang-dropdown glass-card" role="listbox" aria-label="Language selection">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`header__lang-option ${lang.code === language ? 'active' : ''}`}
                  onClick={() => { onLanguageChange(lang.code); setLangOpen(false); }}
                  role="option"
                  aria-selected={lang.code === language}
                >
                  <span>{lang.native}</span>
                  <span className="header__lang-name">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="header__icon-btn" aria-label="3 unread notifications">
          <Bell size={18} strokeWidth={2} />
          <span className="header__notif-badge">3</span>
        </button>

        {/* Clerk User Profile */}
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-9 h-9 border border-[var(--glass-border)] shadow-lg hover:scale-105 transition-transform",
            }
          }}
        />
      </div>
    </header>
  );
}
