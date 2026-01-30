<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Ledger Agent - AI-Powered Bookkeeping

A calendar-based bookkeeping application with AI assistant powered by Google Gemini.

## Features

- 📅 Calendar-based transaction entry
- 🤖 AI Assistant for natural language bookkeeping
- 📊 Reports with charts (Year/Month/Week/Custom)
- 💾 Supabase (PostgreSQL) database support
- 🔄 Daily demo data reset (for demo purposes)

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Database Setup (Supabase)

### Option 1: Use Supabase (Recommended for Production)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the contents of `supabase-schema.sql`
4. Get your Project URL and Anon Key from Settings > API
5. Add them to your `.env.local` file

### Option 2: Use localStorage (Development Only)

If you don't configure Supabase credentials, the app will automatically fall back to localStorage. This is fine for local development but data will be lost when clearing browser data.

## Daily Demo Data Reset

The app includes a feature that:
- Automatically resets the database once per day
- Fills it with realistic demo transactions for the last 3 months
- Useful for demo/showcase purposes

This runs automatically on first load each day. To manually trigger a reset, you can call `db.forceReset()` from the browser console.

## Deploy to Cloud (Free Options)

### Frontend Hosting:
- **Vercel** - `npm run build` then deploy
- **Netlify** - Connect your GitHub repo
- **Cloudflare Pages** - Fast edge deployment

### Database (Supabase Free Tier):
- 500MB database storage
- Unlimited API requests
- Up to 2 projects free

