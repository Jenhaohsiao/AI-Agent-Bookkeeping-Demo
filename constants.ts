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
  income: ['Salary', 'Investment', 'Bonus', 'Other'],
  expense: ['Food', 'Transport', 'Utilities', 'Rent', 'Entertainment', 'Health', 'Other'],
};
