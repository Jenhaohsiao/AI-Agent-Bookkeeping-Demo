import { Transaction, TransactionType } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateDemoTransactions } from './demoDataService';

const DB_KEY = 'gemini_ledger_db';
const LAST_RESET_KEY = 'gemini_ledger_last_reset';

class DBService {
  private useSupabase: boolean;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.useSupabase = isSupabaseConfigured();
  }

  // Initialize database - check if daily reset is needed
  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    await this.initPromise;
    this.initialized = true;
  }

  private async _doInit(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    // Version to force regeneration when demo data logic changes
    const dataVersion = 'v2';
    
    if (this.useSupabase && supabase) {
      // Check last reset date from Supabase
      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'last_reset_date')
        .single();
      
      const lastReset = settings?.value;
      
      if (lastReset !== `${today}-${dataVersion}`) {
        await this.resetWithDemoData();
        // Update last reset date
        await supabase
          .from('app_settings')
          .upsert({ key: 'last_reset_date', value: `${today}-${dataVersion}` });
      }
    } else {
      // localStorage fallback
      const lastReset = localStorage.getItem(LAST_RESET_KEY);
      if (lastReset !== `${today}-${dataVersion}`) {
        await this.resetWithDemoData();
        localStorage.setItem(LAST_RESET_KEY, `${today}-${dataVersion}`);
      }
    }
  }

  // Reset database and fill with demo data for last 3 months
  async resetWithDemoData(): Promise<void> {
    const demoTransactions = generateDemoTransactions();
    
    if (this.useSupabase && supabase) {
      // Clear existing transactions
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert demo data
      const { error } = await supabase.from('transactions').insert(
        demoTransactions.map(tx => ({
          date: tx.date,
          type: tx.type,
          category: tx.category,
          amount: tx.amount,
          description: tx.description,
        }))
      );
      
      if (error) {
        console.error('Error inserting demo data:', error);
      }
    } else {
      // localStorage fallback
      localStorage.setItem(DB_KEY, JSON.stringify(demoTransactions));
    }
    
    window.dispatchEvent(new Event('db-update'));
    console.log(`Database reset with ${demoTransactions.length} demo transactions for last 3 months`);
  }

  // Get all transactions
  async getAll(): Promise<Transaction[]> {
    await this.init();
    
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        type: row.type as TransactionType,
        category: row.category,
        amount: row.amount,
        description: row.description || '',
        createdAt: new Date(row.created_at).getTime(),
      }));
    } else {
      const data = localStorage.getItem(DB_KEY);
      if (!data) {
        await this.resetWithDemoData();
        return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
      }
      return JSON.parse(data);
    }
  }

  // Synchronous version for backward compatibility (uses cache)
  private cachedTransactions: Transaction[] = [];
  
  getAllSync(): Transaction[] {
    return this.cachedTransactions;
  }

  async refreshCache(): Promise<Transaction[]> {
    this.cachedTransactions = await this.getAll();
    return this.cachedTransactions;
  }

  // Add transaction
  async add(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          date: transaction.date,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding transaction:', error);
        throw error;
      }
      
      const newTx: Transaction = {
        id: data.id,
        date: data.date,
        type: data.type as TransactionType,
        category: data.category,
        amount: data.amount,
        description: data.description || '',
        createdAt: new Date(data.created_at).getTime(),
      };
      
      window.dispatchEvent(new Event('db-update'));
      return newTx;
    } else {
      const current = await this.getAll();
      const newTx: Transaction = {
        ...transaction,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      };
      localStorage.setItem(DB_KEY, JSON.stringify([...current, newTx]));
      window.dispatchEvent(new Event('db-update'));
      return newTx;
    }
  }

  // Update transaction
  async update(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<Transaction | null> {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          date: updates.date,
          type: updates.type,
          category: updates.category,
          amount: updates.amount,
          description: updates.description,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating transaction:', error);
        return null;
      }
      
      window.dispatchEvent(new Event('db-update'));
      return {
        id: data.id,
        date: data.date,
        type: data.type as TransactionType,
        category: data.category,
        amount: data.amount,
        description: data.description || '',
        createdAt: new Date(data.created_at).getTime(),
      };
    } else {
      const current = await this.getAll();
      const index = current.findIndex(t => t.id === id);
      if (index === -1) return null;
      
      const updatedTx = { ...current[index], ...updates };
      current[index] = updatedTx;
      localStorage.setItem(DB_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event('db-update'));
      return updatedTx;
    }
  }

  // Delete transaction
  async delete(id: string): Promise<boolean> {
    if (this.useSupabase && supabase) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting transaction:', error);
        return false;
      }
      
      window.dispatchEvent(new Event('db-update'));
      return true;
    } else {
      const current = await this.getAll();
      const filtered = current.filter(t => t.id !== id);
      if (filtered.length === current.length) return false;
      localStorage.setItem(DB_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('db-update'));
      return true;
    }
  }

  // Query transactions with filters
  async query(filters: { 
    dateStart?: string; 
    dateEnd?: string; 
    type?: TransactionType; 
    category?: string 
  }): Promise<Transaction[]> {
    if (this.useSupabase && supabase) {
      let query = supabase.from('transactions').select('*');
      
      if (filters.dateStart) {
        query = query.gte('date', filters.dateStart);
      }
      if (filters.dateEnd) {
        query = query.lte('date', filters.dateEnd);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.ilike('category', `%${filters.category}%`);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) {
        console.error('Error querying transactions:', error);
        return [];
      }
      
      return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        type: row.type as TransactionType,
        category: row.category,
        amount: row.amount,
        description: row.description || '',
        createdAt: new Date(row.created_at).getTime(),
      }));
    } else {
      let data = await this.getAll();
      
      if (filters.dateStart) {
        data = data.filter(t => t.date >= filters.dateStart!);
      }
      if (filters.dateEnd) {
        data = data.filter(t => t.date <= filters.dateEnd!);
      }
      if (filters.type) {
        data = data.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        data = data.filter(t => t.category.toLowerCase().includes(filters.category!.toLowerCase()));
      }
      
      return data;
    }
  }

  // Force reset (can be called manually)
  async forceReset(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.resetWithDemoData();
    
    if (this.useSupabase && supabase) {
      await supabase
        .from('app_settings')
        .upsert({ key: 'last_reset_date', value: today });
    } else {
      localStorage.setItem(LAST_RESET_KEY, today);
    }
  }
}

export const db = new DBService();
