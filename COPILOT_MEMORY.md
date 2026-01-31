# AI Agent Bookkeeping Demo - Project Memory

> Last Updated: 2026-01-31

## Project Overview

Smart Ledger AI Agent with calculator integration:
- **Left Panel**: Calendar (red/green dots for expense/income), transaction form, reports
- **Right Panel**: Gemini AI chat assistant + voice input + language selector
- **Calculator**: Draggable floating widget, AI can operate it visually for calculations
- **UI Style**: Modern responsive design with split-panel layout

## Tech Stack

- React 19 + TypeScript + Vite 6.4.1
- Google Gemini API (`@google/genai` SDK) - gemini-2.5-flash with Function Calling
- Web Speech API (voice recognition, multi-language)
- opencc-js (Simplified to Traditional Chinese conversion)
- Supabase (PostgreSQL) / localStorage fallback
- Lucide React, Recharts, date-fns, Tailwind CSS

## Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Responsive UI | Done | Split-panel layout, mobile optimized |
| Calendar | Done | Arrow navigation, month/year dropdowns, colored dots |
| i18n | Done | English (default), Traditional Chinese, Simplified Chinese |
| Voice Input | Done | Multi-language, auto Simplified-to-Traditional conversion |
| Gemini AI | Done | Function Calling + scope restriction (finance only) |
| Reports | Done | Expense/income breakdown, transaction list |
| PDF Export | Done | Print styles optimized |
| Database | Done | localStorage working, Supabase ready |
| Demo Data | Done | 3 months data, 35% random skip |
| Calculator | Done | Draggable, copy result, close button |
| AI Calculator | Done | AI uses calculator visually for math operations |

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main layout, calculator button, event listeners |
| `components/LeftPanel.tsx` | Calendar, forms, reports |
| `components/RightPanel.tsx` | AI chat interface + voice input |
| `components/Calculator.tsx` | Draggable calculator with AI control |
| `services/geminiService.ts` | AI Agent core, function calling tools |
| `i18n/translations.ts` | All translation strings |

## AI Function Calling Tools

| Tool | Purpose |
|------|---------|
| `addTransaction` | Add income/expense records |
| `queryTransactions` | Query records by date/type/category |
| `deleteTransaction` | Delete a transaction by ID |
| `printReport` | Trigger report print dialog |
| `controlCalculator` | Open/close the calculator |
| `useCalculator` | Perform visual calculation on calculator |

## Environment Setup

```bash
cp .env.example .env.local
# VITE_GEMINI_API_KEY=your-key
# VITE_SUPABASE_URL=your-url (optional)
# VITE_SUPABASE_ANON_KEY=your-key (optional)
npm install && npm run dev
```

## Recent Changes (2026-01-31)

1. Added floating Calculator component with drag support
2. AI can open/close calculator via `controlCalculator` tool
3. AI uses `useCalculator` tool to perform math visually (users see button presses)
4. Fixed React closure issues in calculator state management using refs
5. Converted all comments to English, updated README

## Known Issues

None currently. All features working as expected.

## Deployment Ready

All features complete. For production:
- Set Supabase credentials for persistent storage
- Deploy to Vercel/Netlify/Cloudflare Pages

---
*Start next session with: "Please read COPILOT_MEMORY.md"*
