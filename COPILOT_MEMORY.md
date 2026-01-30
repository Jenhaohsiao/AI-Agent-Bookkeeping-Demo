# AI Agent Bookkeeping Demo - 專案記憶檔

> 最後更新：2026-01-30 (Git 歷史已重建)

## 📋 專案概述

「日曆式記帳本」AI Agent 專案：
- **左側面板**：日曆、交易表單、報表圖表
- **右側面板**：Gemini AI 聊天助手
- **UI 風格**：macOS 風格分割視窗

## 🛠️ 技術棧

- React 19 + TypeScript + Vite 6.4.1
- Google Gemini API (`@google/genai` SDK) - Function Calling
- Supabase (PostgreSQL) / localStorage 備援
- Lucide React, Recharts, date-fns

## ✅ 已完成功能 (100% 可運作)

| 功能 | 狀態 | 說明 |
|------|------|------|
| UI 佈局 | ✅ | 左右分割面板，macOS 風格 |
| 日曆 | ✅ | 箭頭切換、月/年選單、點選日期 |
| 資料庫 | ✅ | localStorage 運作中，Supabase 待設定 |
| Demo 資料 | ✅ | 3個月資料，35% 隨機跳過 |
| Gemini AI | ✅ | Function Calling 正常運作 |
| AI 驗證 | ✅ | 資訊不足會詢問用戶 |
| AI 通知動畫 | ✅ | 新增後跳轉+藍色高亮3秒 |
| Git 安全 | ✅ | API Key 已從歷史移除 |

## 🔧 環境設定

```bash
# 1. 複製範本
cp .env.example .env.local

# 2. 填入 API Keys
VITE_GEMINI_API_KEY=your-key
VITE_SUPABASE_URL=your-url (可選)
VITE_SUPABASE_ANON_KEY=your-key (可選)

# 3. 啟動
npm install && npm run dev
```

## 📁 關鍵檔案

| 檔案 | 用途 |
|------|------|
| `services/geminiService.ts` | AI Agent 核心，含 system instruction |
| `components/LeftPanel.tsx` | 日曆、表單、報表、高亮動畫 |
| `components/RightPanel.tsx` | AI 聊天介面 |
| `services/dbService.ts` | 資料庫操作 (async) |
| `.env.example` | 環境變數範本 |

## 🧪 快速測試

```
✅ 「幫我新增今天午餐花了 150 元」→ 直接新增 + 動畫
✅ 「今天花了 150 元」→ AI 會詢問類別
✅ 「查詢這個月的支出」→ 回傳統計
```

## 📌 待處理/可改進

| 優先級 | 項目 | 說明 |
|--------|------|------|
| 🟡 中 | Supabase | 程式碼就緒，需設定 credentials |
| 🟢 低 | 日曆動畫 | 可加入日期閃爍效果 |
| 🟢 低 | 多語言 | 目前 UI 英文，AI 繁中 |

## ⚠️ 注意事項

1. **API Key 安全**：永遠不要提交 `.env.local`，已加入 `.gitignore`
2. **Git 歷史**：2026-01-30 已完全重建，舊的含 API Key 歷史已刪除
3. **Gemini 日期**：system instruction 動態生成今天日期

---
*下次開對話說：「請閱讀 COPILOT_MEMORY.md」即可快速接續*
