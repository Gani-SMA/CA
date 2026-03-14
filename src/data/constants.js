// ═══════════════════════════════════════════════
// STATIC CONSTANTS — Personal Finance Advisor
// These are app-level constants, NOT user data
// ═══════════════════════════════════════════════

export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', color: '#f97316', emoji: '🍔' },
  { id: 'transport', name: 'Transport', color: '#3b82f6', emoji: '🚗' },
  { id: 'bills', name: 'Bills & Utilities', color: '#ef4444', emoji: '⚡' },
  { id: 'shopping', name: 'Shopping', color: '#ec4899', emoji: '🛍️' },
  { id: 'entertainment', name: 'Entertainment', color: '#8b5cf6', emoji: '🎮' },
  { id: 'healthcare', name: 'Healthcare', color: '#10b981', emoji: '❤️' },
  { id: 'investment', name: 'Investment', color: '#06b6d4', emoji: '📈' },
  { id: 'education', name: 'Education', color: '#f59e0b', emoji: '📚' },
  { id: 'travel', name: 'Travel', color: '#a855f7', emoji: '✈️' },
  { id: 'other', name: 'Other', color: '#64748b', emoji: '📦' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
];

export const PROFILE_TYPES = [
  { id: 'student', label: 'Student', emoji: '🎓' },
  { id: 'employee', label: 'Salaried Employee', emoji: '💼' },
  { id: 'business', label: 'Business Owner', emoji: '🏢' },
  { id: 'freelancer', label: 'Freelancer', emoji: '💻' },
  { id: 'retired', label: 'Retired', emoji: '🏖️' },
];

export const RISK_LEVELS = [
  { id: 'low', label: 'Conservative', desc: 'FDs, PPF, Debt Funds' },
  { id: 'medium', label: 'Moderate', desc: 'Balanced Funds, Index Funds' },
  { id: 'high', label: 'Aggressive', desc: 'Equities, Small-Cap Funds' },
];

export const API_BASE = 'http://localhost:3001';

export const IS_CLERK_BYPASS = import.meta.env.VITE_BYPASS_CLERK === 'true';
