import { Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../constants';
import { format, subDays, subMonths } from 'date-fns';

// Demo data descriptions for realistic transactions
const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  Food: ['Lunch at restaurant', 'Grocery shopping', 'Coffee shop', 'Dinner takeout', 'Breakfast', 'Snacks'],
  Transport: ['Uber ride', 'Gas station', 'Bus ticket', 'Metro card', 'Parking fee', 'Taxi'],
  Utilities: ['Electric bill', 'Water bill', 'Internet bill', 'Phone bill', 'Gas bill'],
  Rent: ['Monthly rent', 'Rent payment'],
  Entertainment: ['Movie tickets', 'Netflix subscription', 'Concert', 'Video game', 'Spotify', 'Books'],
  Health: ['Pharmacy', 'Doctor visit', 'Gym membership', 'Vitamins', 'Dental checkup'],
  Other: ['Shopping', 'Gift', 'Household items', 'Repair', 'Miscellaneous'],
};

const INCOME_DESCRIPTIONS: Record<string, string[]> = {
  Salary: ['Monthly salary', 'Salary deposit', 'Paycheck'],
  Investment: ['Stock dividend', 'Interest income', 'Investment return'],
  Bonus: ['Year-end bonus', 'Performance bonus', 'Holiday bonus'],
  Other: ['Freelance work', 'Refund', 'Gift received', 'Side income'],
};

// Amount ranges for different categories (min, max)
const EXPENSE_AMOUNTS: Record<string, [number, number]> = {
  Food: [8, 80],
  Transport: [5, 50],
  Utilities: [30, 200],
  Rent: [800, 2000],
  Entertainment: [10, 100],
  Health: [20, 300],
  Other: [10, 150],
};

const INCOME_AMOUNTS: Record<string, [number, number]> = {
  Salary: [3000, 8000],
  Investment: [50, 500],
  Bonus: [500, 3000],
  Other: [100, 1000],
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDemoTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  
  let id = 1;
  
  // Generate transactions for each day in the last 3 months
  let currentDate = threeMonthsAgo;
  
  while (currentDate <= today) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfMonth = currentDate.getDate();
    
    // Important days that always have data: 1st (salary + rent) and 15th (salary)
    const isImportantDay = dayOfMonth === 1 || dayOfMonth === 15;
    
    // 35% chance to skip this day entirely (except for important days)
    const skipDay = !isImportantDay && Math.random() < 0.35;
    
    // If skipping this day, move to next day immediately
    if (skipDay) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      continue;
    }
    
    // Add salary on the 1st or 15th of each month
    if (isImportantDay) {
      const category = 'Salary';
      const [min, max] = INCOME_AMOUNTS[category];
      transactions.push({
        id: String(id++),
        date: dateStr,
        type: 'income',
        category,
        amount: dayOfMonth === 1 ? randomBetween(min, max) : randomBetween(min / 2, max / 2),
        description: randomFromArray(INCOME_DESCRIPTIONS[category]),
        createdAt: currentDate.getTime(),
      });
      
      // Add rent on 1st of month
      if (dayOfMonth === 1) {
        const [rentMin, rentMax] = EXPENSE_AMOUNTS['Rent'];
        transactions.push({
          id: String(id++),
          date: dateStr,
          type: 'expense',
          category: 'Rent',
          amount: randomBetween(rentMin, rentMax),
          description: randomFromArray(EXPENSE_DESCRIPTIONS['Rent']),
          createdAt: currentDate.getTime(),
        });
      }
    }
    
    // Random chance for other income (8% per day)
    if (Math.random() < 0.08) {
      const incomeCategories = CATEGORIES.income.filter(c => c !== 'Salary');
      const category = randomFromArray(incomeCategories);
      const [min, max] = INCOME_AMOUNTS[category] || [50, 500];
      transactions.push({
        id: String(id++),
        date: dateStr,
        type: 'income',
        category,
        amount: randomBetween(min, max),
        description: randomFromArray(INCOME_DESCRIPTIONS[category] || ['Income']),
        createdAt: currentDate.getTime(),
      });
    }
    
    // Generate 1-3 random expenses per day
    const numExpenses = randomBetween(1, 3);
    for (let i = 0; i < numExpenses; i++) {
      const availableCategories = CATEGORIES.expense.filter(c => c !== 'Rent');
      const category = randomFromArray(availableCategories);
      const [min, max] = EXPENSE_AMOUNTS[category] || [10, 100];
      
      transactions.push({
        id: String(id++),
        date: dateStr,
        type: 'expense',
        category,
        amount: randomBetween(min, max),
        description: randomFromArray(EXPENSE_DESCRIPTIONS[category] || ['Expense']),
        createdAt: currentDate.getTime(),
      });
    }
    
    // Move to next day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return transactions;
}
