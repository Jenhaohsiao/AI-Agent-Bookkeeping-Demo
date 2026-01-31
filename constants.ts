export const INITIAL_TRANSACTIONS = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    category: 'Salary',
    amount: 5000,
    description: 'Monthly Salary',
    createdAt: Date.now(),
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: 'Utilities',
    amount: 150,
    description: 'Electric Bill',
    createdAt: Date.now(),
  },
] as const;

export const CATEGORIES = {
  income: ['Salary', 'Investment', 'Bonus', 'Freelance', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Rent', 'Education', 'Travel', 'Other'],
};

// Category icons and color configuration
export const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  // Income categories
  Salary: { icon: '💰', color: '#10b981', bgColor: '#d1fae5' },
  Investment: { icon: '📈', color: '#3b82f6', bgColor: '#dbeafe' },
  Bonus: { icon: '🎁', color: '#8b5cf6', bgColor: '#ede9fe' },
  Freelance: { icon: '💻', color: '#06b6d4', bgColor: '#cffafe' },
  Gift: { icon: '🎀', color: '#ec4899', bgColor: '#fce7f3' },
  // Expense categories
  Food: { icon: '🍽️', color: '#f97316', bgColor: '#ffedd5' },
  Transport: { icon: '🚗', color: '#3b82f6', bgColor: '#dbeafe' },
  Shopping: { icon: '🛍️', color: '#ec4899', bgColor: '#fce7f3' },
  Entertainment: { icon: '🎬', color: '#8b5cf6', bgColor: '#ede9fe' },
  Health: { icon: '💊', color: '#ef4444', bgColor: '#fee2e2' },
  Utilities: { icon: '💡', color: '#eab308', bgColor: '#fef9c3' },
  Rent: { icon: '🏠', color: '#6366f1', bgColor: '#e0e7ff' },
  Education: { icon: '📚', color: '#14b8a6', bgColor: '#ccfbf1' },
  Travel: { icon: '✈️', color: '#0ea5e9', bgColor: '#e0f2fe' },
  Other: { icon: '📝', color: '#6b7280', bgColor: '#f3f4f6' },
};
