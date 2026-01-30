export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  isToolOutput?: boolean;
}

export type ViewMode = 'entry' | 'report';
export type ReportRange = 'year' | 'month' | 'week' | 'day' | 'custom';

export interface ReportData {
  label: string;
  income: number;
  expense: number;
}
