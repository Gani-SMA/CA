// ═══════════════════════════════════════════════
// FINANCE SERVICE – API-shaped service layer
// Swap mock implementations for real FastAPI calls
// ═══════════════════════════════════════════════

import {
  CATEGORIES, MONTHLY_SPENDING, TRANSACTIONS, MONTHLY_TRENDS,
  BUDGET_SUMMARY, INVESTMENTS, SAVINGS_GOALS, SOS_ALERTS,
  AI_SUGGESTIONS, ANOMALIES, CHAT_RESPONSES, USER_PROFILE,
} from '../data/mockData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const financeService = {
  async getCategories() {
    await delay(100);
    return CATEGORIES;
  },

  async getMonthlySpending() {
    await delay(150);
    return MONTHLY_SPENDING;
  },

  async getTransactions(limit = 15) {
    await delay(200);
    return TRANSACTIONS.slice(0, limit);
  },

  async getMonthlyTrends() {
    await delay(150);
    return MONTHLY_TRENDS;
  },

  async getBudgetSummary() {
    await delay(100);
    return BUDGET_SUMMARY;
  },

  async getInvestments() {
    await delay(200);
    return INVESTMENTS;
  },

  async getSavingsGoals() {
    await delay(150);
    return SAVINGS_GOALS;
  },

  async getSOSAlerts() {
    await delay(100);
    return SOS_ALERTS;
  },

  async getAISuggestions() {
    await delay(200);
    return AI_SUGGESTIONS;
  },

  async getAnomalies() {
    await delay(150);
    return ANOMALIES;
  },

  async getUserProfile() {
    await delay(100);
    return USER_PROFILE;
  },

  async getChatResponse(message, lang = 'en') {
    await delay(800);
    const responses = CHAT_RESPONSES[lang] || CHAT_RESPONSES.en;
    const lower = message.toLowerCase();
    if (lower.includes('dining') || lower.includes('food') || lower.includes('restaurant')) {
      return responses.reduceDining;
    }
    if (lower.includes('emergency') || lower.includes('fund') || lower.includes('safety')) {
      return responses.emergencyFund;
    }
    if (lower.includes('invest') || lower.includes('stock') || lower.includes('mutual')) {
      return responses.investmentTips;
    }
    return responses.default;
  },
};
