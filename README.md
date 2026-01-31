# AI Agent Bookkeeping Demo

A modern bookkeeping web application with AI assistant powered by Google Gemini. Features a responsive split-panel UI with calendar-based transaction management and natural language interaction.

## Tech Stack

- React 19 + TypeScript + Vite
- Google Gemini API (gemini-2.5-flash) with Function Calling
- Web Speech API for voice input
- Supabase (PostgreSQL) / localStorage fallback
- Tailwind CSS, Recharts, date-fns

## Features

- Calendar-based transaction entry with income/expense indicators
- AI assistant for natural language bookkeeping (add, query, delete transactions)
- Voice input with Simplified-to-Traditional Chinese conversion
- Multi-language support (English, Traditional Chinese, Simplified Chinese)
- Financial reports with pie charts and transaction lists
- PDF export functionality
- Responsive design for desktop and mobile
- Daily demo data auto-reset for showcase purposes

## Quick Start

Prerequisites: Node.js 18+

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

Environment variables:
- `VITE_GEMINI_API_KEY` - Google Gemini API key (required)
- `VITE_SUPABASE_URL` - Supabase project URL (optional)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (optional)

Without Supabase credentials, the app uses localStorage as fallback.

## Database Setup (Optional)

1. Create a project at supabase.com
2. Run `supabase-schema.sql` in SQL Editor
3. Add credentials to `.env.local`

## Project Structure

```
App.tsx              - Main layout with split-panel UI
components/
  LeftPanel.tsx      - Calendar, forms, reports
  RightPanel.tsx     - AI chat interface
services/
  geminiService.ts   - AI agent with function calling
  dbService.ts       - Database operations
  supabaseClient.ts  - Supabase connection
i18n/                - Multi-language translations
```

## AI Capabilities

The AI assistant can:
- Add transactions: "Spent $50 on lunch today"
- Query records: "How much did I spend this month?"
- Delete entries: "Delete the lunch expense from yesterday"
- Generate reports: "Print this month's report"

The AI is scoped to financial tasks only and will politely decline unrelated requests.

## Deployment

Build: `npm run build`

Recommended platforms:
- Vercel, Netlify, or Cloudflare Pages for frontend
- Supabase free tier for database (500MB storage)

## License

MIT
