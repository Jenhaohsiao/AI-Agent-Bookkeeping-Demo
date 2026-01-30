# AI Agent Bookkeeping Demo - 專案記憶檔

> 最後更新：2026-01-30

## 📋 專案概述

這是一個「日曆式記帳本」AI Agent 專案，結合：
- **左側面板**：日曆視圖、交易表單、報表圖表
- **右側面板**：AI 聊天助手（使用 Gemini）
- **UI 風格**：macOS 風格，滑鼠懸停可調整面板大小

## 🛠️ 技術棧

| 類別 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 建置工具 | Vite 6.4.1 |
| AI/LLM | Google Gemini API (`@google/genai` SDK) |
| 資料庫 | Supabase (PostgreSQL) / localStorage 備援 |
| UI 元件 | Lucide React (icons), Recharts (圖表) |
| 日期處理 | date-fns |

## 📁 專案結構

```
├── App.tsx              # 主佈局，分割面板控制
├── components/
│   ├── LeftPanel.tsx    # 日曆、交易表單、報表
│   └── RightPanel.tsx   # AI 聊天介面
├── services/
│   ├── geminiService.ts # Gemini AI Agent (Function Calling)
│   ├── dbService.ts     # 資料庫操作 (async)
│   ├── supabaseClient.ts# Supabase 連線
│   └── demoDataService.ts # Demo 資料生成
├── types.ts             # TypeScript 型別定義
├── constants.ts         # 常數設定
└── .env.local           # 環境變數 (API Keys)
```

## ✅ 已完成功能

1. **UI 佈局**
   - 左右分割面板，左側預設 70%
   - 面板鎖定功能（預設鎖定）
   - macOS 風格懸停效果

2. **日曆功能**
   - 左右箭頭切換月份
   - 月份/年份下拉選單
   - 點擊日期顯示當日交易

3. **資料庫整合**
   - Supabase 程式碼已就緒（需設定 credentials）
   - localStorage 備援機制
   - 所有方法皆為 async

4. **Demo 資料**
   - 自動生成過去 3 個月資料
   - 35% 機率跳過非重要日期（模擬真實情況）
   - `dataVersion` 控制強制重新生成

5. **AI 整合** ✅ 已修復
   - Gemini API 連線正常
   - Function Calling 運作正常
   - 系統指令設定繁體中文偏好
   - 今天日期動態生成（修復了日期錯誤問題）

6. **AI 智慧驗證** ✅ 新增
   - 資訊不足時會詢問用戶（不再自動使用 Uncategorized）
   - 明確的類別對照表（午餐→Food, 打車→Transport 等）

7. **AI 完成通知** ✅ 新增
   - AI 新增交易後發送 `ai-transaction-added` 事件
   - UI 自動跳轉到更新的日期
   - 新增的交易會有藍色高亮動畫效果（3秒）

## ⚠️ 待處理問題

### 🟡 中優先級

1. **Supabase 設定**
   - 狀態：程式碼就緒，credentials 未設定
   - 需要：在 `.env.local` 設定真實的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
   - 資料庫 schema：`supabase-schema.sql`

## 🔧 環境設定

### .env.local 內容（請複製 .env.example 並填入你的 keys）
```env
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 啟動指令
```bash
npm install
npm run dev
```

## 📝 重要程式碼片段

### AI 事件通知機制 (geminiService.ts)
```typescript
// 新增交易後發送事件
window.dispatchEvent(new CustomEvent('ai-transaction-added', { 
  detail: { date: args.date, id: apiResponse.id, type: 'add' } 
}));
```

### LeftPanel 事件監聽
```typescript
// 監聽 AI 事件，切換日期並高亮
const handleAiAdd = (e: CustomEvent) => {
  const { date, id } = e.detail;
  setViewMode("entry");
  setSelectedDate(date);
  setHighlightedId(id);
  setTimeout(() => setHighlightedId(null), 3000);
};
window.addEventListener("ai-transaction-added", handleAiAdd);
```

### 高亮樣式
```typescript
className={`... transition-all duration-500
  ${highlightedId === t.id 
    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300 animate-pulse" 
    : "border-gray-100"
  }`}
```

### Gemini 驗證規則
```
Before calling 'addTransaction', you MUST have:
1. Date (今天/昨天 OK)
2. Type (income/expense)
3. Category (必須明確，不可用 Uncategorized)
4. Amount (必填)

如果 category 不明確，必須詢問用戶。
```

## 🧪 測試指令

在 AI 聊天輸入以下訊息測試：
- ✅ 「幫我新增今天午餐花了 150 元」（有明確類別→直接新增）
- ✅ 「今天花了 150 元」（無類別→應詢問用戶）
- ✅ 「查詢這個月的支出」
- ✅ 「刪除 ID 為 xxx 的交易」

## 📌 下次繼續事項

1. 測試 AI 詢問功能是否正常運作
2. 測試高亮動畫效果是否正確顯示
3. 設定 Supabase 進行雲端部署測試
4. 考慮增加更多動畫效果（如日曆日期閃爍）

---
*此檔案由 GitHub Copilot 生成，用於跨對話記憶專案狀態*
