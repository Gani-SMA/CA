// ═══════════════════════════════════════════════
// MOCK DATA – Personal Finance Advisor
// Realistic Indian Rupee-based financial data
// ═══════════════════════════════════════════════

export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', color: '#f97316', budget: 8000 },
  { id: 'transport', name: 'Transport', color: '#3b82f6', budget: 5000 },
  { id: 'bills', name: 'Bills & Utilities', color: '#ef4444', budget: 12000 },
  { id: 'shopping', name: 'Shopping', color: '#ec4899', budget: 6000 },
  { id: 'entertainment', name: 'Entertainment', color: '#8b5cf6', budget: 4000 },
  { id: 'healthcare', name: 'Healthcare', color: '#10b981', budget: 3000 },
  { id: 'investment', name: 'Investment', color: '#06b6d4', budget: 15000 },
];

export const MONTHLY_SPENDING = {
  food: 7200,
  transport: 4800,
  bills: 11500,
  shopping: 8200,
  entertainment: 3500,
  healthcare: 1800,
  investment: 15000,
};

export const TRANSACTIONS = [
  { id: 1, date: '2026-03-13', category: 'food', description: 'Swiggy Order', amount: 450, type: 'debit' },
  { id: 2, date: '2026-03-13', category: 'transport', description: 'Uber Ride', amount: 280, type: 'debit' },
  { id: 3, date: '2026-03-12', category: 'shopping', description: 'Amazon Purchase', amount: 2499, type: 'debit' },
  { id: 4, date: '2026-03-12', category: 'bills', description: 'Electricity Bill', amount: 3200, type: 'debit' },
  { id: 5, date: '2026-03-11', category: 'entertainment', description: 'Netflix Subscription', amount: 649, type: 'debit' },
  { id: 6, date: '2026-03-11', category: 'food', description: 'Zomato Order', amount: 720, type: 'debit' },
  { id: 7, date: '2026-03-10', category: 'healthcare', description: 'Apollo Pharmacy', amount: 890, type: 'debit' },
  { id: 8, date: '2026-03-10', category: 'investment', description: 'SIP Deduction', amount: 5000, type: 'debit' },
  { id: 9, date: '2026-03-09', category: 'transport', description: 'Metro Card Recharge', amount: 500, type: 'debit' },
  { id: 10, date: '2026-03-09', category: 'shopping', description: 'Flipkart Order', amount: 1899, type: 'debit' },
  { id: 11, date: '2026-03-08', category: 'food', description: 'Grocery - BigBasket', amount: 1850, type: 'debit' },
  { id: 12, date: '2026-03-08', category: 'bills', description: 'Mobile Recharge', amount: 699, type: 'debit' },
  { id: 13, date: '2026-03-07', category: 'entertainment', description: 'BookMyShow', amount: 800, type: 'debit' },
  { id: 14, date: '2026-03-07', category: 'transport', description: 'Ola Ride', amount: 350, type: 'debit' },
  { id: 15, date: '2026-03-06', category: 'food', description: 'Restaurant - Barbeque Nation', amount: 2200, type: 'debit' },
];

export const MONTHLY_TRENDS = [
  { month: 'Oct', income: 75000, expense: 48000, savings: 27000 },
  { month: 'Nov', income: 75000, expense: 52000, savings: 23000 },
  { month: 'Dec', income: 80000, expense: 61000, savings: 19000 },
  { month: 'Jan', income: 75000, expense: 45000, savings: 30000 },
  { month: 'Feb', income: 75000, expense: 50000, savings: 25000 },
  { month: 'Mar', income: 78000, expense: 52000, savings: 26000 },
];

export const BUDGET_SUMMARY = {
  totalBudget: 53000,
  totalSpent: 52000,
  totalIncome: 78000,
  savingsGoal: 20000,
  currentSavings: 26000,
  savingsRate: 33.3,
};

export const INVESTMENTS = [
  { id: 1, name: 'SBI Bluechip Fund', type: 'Mutual Fund', invested: 120000, current: 142800, returns: 19, monthlyData: [100, 105, 108, 112, 119, 125, 128, 130, 135, 138, 140, 142.8] },
  { id: 2, name: 'HDFC Mid-Cap SIP', type: 'SIP', invested: 60000, current: 68400, returns: 14, monthlyData: [50, 52, 51, 54, 56, 58, 60, 61, 63, 65, 67, 68.4] },
  { id: 3, name: 'Reliance Industries', type: 'Stock', invested: 45000, current: 52650, returns: 17, monthlyData: [45, 43, 46, 48, 47, 49, 50, 51, 50, 52, 53, 52.6] },
  { id: 4, name: 'PPF Account', type: 'Savings Scheme', invested: 150000, current: 168000, returns: 12, monthlyData: [150, 151.5, 153, 154.5, 156, 157.5, 159, 160.5, 162, 163.5, 165, 168] },
  { id: 5, name: 'Nifty 50 ETF', type: 'ETF', invested: 30000, current: 35100, returns: 17, monthlyData: [30, 29, 31, 30, 32, 33, 31, 33, 34, 34, 35, 35.1] },
];

export const SAVINGS_GOALS = [
  { id: 1, name: 'Emergency Fund', target: 300000, saved: 195000 },
  { id: 2, name: 'Vacation Fund', target: 100000, saved: 42000 },
  { id: 3, name: 'New Laptop', target: 80000, saved: 65000 },
  { id: 4, name: 'Home Down Payment', target: 1500000, saved: 380000 },
];

export const SOS_ALERTS = [
  {
    type: 'saving',
    title: 'Monthly Saving SOS',
    message: 'Your saving rate dropped to 18% this month — below the safe level of 25%.',
    severity: 'high',
    action: 'Review Spending',
    color: 'cyan',
  },
  {
    type: 'expenditure',
    title: 'Expenditure Limit SOS',
    message: 'Shopping category exceeded budget by ₹2,200. You have spent ₹8,200 against ₹6,000 limit.',
    severity: 'medium',
    action: 'Set Limit',
    color: 'amber',
  },
  {
    type: 'investment',
    title: 'Investment Opportunity',
    message: 'Surplus of ₹15,000 detected. Consider investing in Nifty 50 ETF for long-term growth.',
    severity: 'low',
    action: 'Invest Now',
    color: 'emerald',
  },
];

export const AI_SUGGESTIONS = [
  { id: 1, title: 'Reduce Dining Out', text: 'You spent ₹3,370 on restaurants this month. Cooking at home 3 more days/week could save ₹1,800.', impact: '₹1,800/mo' },
  { id: 2, title: 'Increase Emergency Fund', text: 'Your emergency fund covers 2.6 months. Aim for 6 months by adding ₹5,000/month.', impact: '₹5,000/mo' },
  { id: 3, title: 'Optimize Subscriptions', text: 'You have 4 active subscriptions totaling ₹2,100/month. Consider consolidating.', impact: '₹800/mo' },
  { id: 4, title: 'Tax Saving Investment', text: 'You can still invest ₹50,000 in ELSS to save taxes under Section 80C.', impact: '₹15,000 tax' },
];

export const ANOMALIES = [
  { id: 1, date: '2026-03-13', message: 'Unusual spending: ₹2,499 on Amazon — 3x your usual online shopping.', type: 'warning' },
  { id: 2, date: '2026-03-10', message: 'First-time purchase at Apollo Pharmacy detected.', type: 'info' },
  { id: 3, date: '2026-03-07', message: 'Restaurant spend this week is 40% higher than average.', type: 'warning' },
];

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
];

export const CHAT_RESPONSES = {
  en: {
    greeting: "Hello! I'm your AI Financial Coach. How can I help you today?",
    reduceDining: "Based on your spending patterns, you've spent ₹7,200 on food this month. I recommend cooking at home 3 more days per week. This could save you approximately ₹1,800 per month.",
    emergencyFund: "Your emergency fund currently has ₹1,95,000 — covering about 2.6 months of expenses. The recommended level is 6 months (₹4,50,000). I suggest increasing your monthly contribution by ₹5,000.",
    investmentTips: "Given your current surplus, I recommend: 1) ₹5,000 in Nifty 50 ETF for diversification, 2) ₹5,000 in ELSS for tax saving, 3) ₹5,000 in your emergency fund.",
    default: "I can help you with budgeting, investment advice, savings planning, and expense analysis. What would you like to know?",
  },
  hi: {
    greeting: "नमस्ते! मैं आपका AI वित्तीय कोच हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
    reduceDining: "आपके खर्च के पैटर्न के अनुसार, इस महीने आपने भोजन पर ₹7,200 खर्च किए हैं। मैं सप्ताह में 3 और दिन घर पर खाना बनाने की सलाह देता हूं।",
    emergencyFund: "आपके आपातकालीन फंड में वर्तमान में ₹1,95,000 हैं। अनुशंसित स्तर 6 महीने (₹4,50,000) है।",
    investmentTips: "आपके वर्तमान अधिशेष को देखते हुए, मैं सुझाव देता हूं: 1) निफ्टी 50 ETF में ₹5,000, 2) ELSS में ₹5,000 टैक्स बचत के लिए।",
    default: "मैं बजट, निवेश सलाह, बचत योजना और खर्च विश्लेषण में आपकी मदद कर सकता हूं।",
  },
  ta: {
    greeting: "வணக்கம்! நான் உங்கள் AI நிதி ஆலோசகர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    reduceDining: "உங்கள் செலவு முறைகளின் அடிப்படையில், இந்த மாதம் உணவுக்கு ₹7,200 செலவழித்துள்ளீர்கள்.",
    emergencyFund: "உங்கள் அவசரகால நிதியில் தற்போது ₹1,95,000 உள்ளது.",
    investmentTips: "உங்கள் தற்போதைய உபரியை கருத்தில் கொண்டு, நான் பரிந்துரைக்கிறேன்.",
    default: "பட்ஜெட், முதலீட்டு ஆலோசனை, சேமிப்பு திட்டமிடல் ஆகியவற்றில் நான் உங்களுக்கு உதவ முடியும்.",
  },
};

export const USER_PROFILE = {
  name: 'Arjun Sharma',
  avatar: 'AS',
  monthlyIncome: 78000,
  accountBalance: 245000,
  joinDate: '2025-06-15',
};
