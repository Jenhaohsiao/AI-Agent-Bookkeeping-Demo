-- Supabase Schema for Gemini Ledger Agent
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Create app_settings table for storing configuration (like last reset date)
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for demo purposes)
-- In production, you should use proper authentication

-- Policy: Allow all operations on transactions for anonymous users
CREATE POLICY "Allow anonymous access to transactions" ON transactions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy: Allow all operations on app_settings for anonymous users
CREATE POLICY "Allow anonymous access to app_settings" ON app_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions to anonymous users
GRANT ALL ON transactions TO anon;
GRANT ALL ON app_settings TO anon;
