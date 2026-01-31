# AI Agent Bookkeeping Demo - 專案記憶檔

> 最後更新：2026-01-31

## 📋 專案概述

「智能記帳本」AI Agent 專案：
- **左側面板**：日曆（紅綠點標示收支）、交易表單、報表圖表
- **右側面板**：Gemini AI 聊天助手 + 語音輸入 + 多語言選擇
- **UI 風格**：現代響應式設計，左右分離面板

## 🛠️ 技術棧

- React 19 + TypeScript + Vite 6.4.1
- Google Gemini API (`@google/genai` SDK) - **gemini-2.5-flash**
- Web Speech API（語音辨識，支援多語言）
- opencc-js（簡體→繁體中文轉換）
- Supabase (PostgreSQL) / localStorage 備援
- Lucide React, Recharts, date-fns, Tailwind CSS

## ✅ 已完成功能

| 功能 | 狀態 | 說明 |
|------|------|------|
| 響應式 UI | ✅ | 左右分割面板，手機版優化 |
| 日曆 | ✅ | 箭頭切換、月/年選單、紅點(支出)/綠點(收入)標示 |
| 多語言 i18n | ✅ | 英文(預設)、繁體中文、簡體中文 |
| 語音輸入 | ✅ | 支援多語言，自動轉換簡體→繁體 |
| Gemini AI | ✅ | Function Calling + 範圍限制（僅限財務相關） |
| 報表 | ✅ | 支出分析 + 收入分析（含百分比）、交易明細 |
| PDF 匯出 | ✅ | 列印樣式優化，隱藏圖表只顯示清單 |
| 資料庫 | ✅ | localStorage 運作中，Supabase 待設定 |
| Demo 資料 | ✅ | 3個月資料，35% 隨機跳過 |

## 🌐 多語言系統

- **檔案位置**：`i18n/translations.ts`, `i18n/LanguageContext.tsx`
- **使用方式**：`const { t, tArray, language } = useLanguage()`
- **語言切換**：右上角下拉選單
- **翻譯鍵**：約 60+ 個，包含陣列類型（如 weekdaysShort）

## 📁 關鍵檔案

| 檔案 | 用途 |
|------|------|
| `App.tsx` | 主佈局、左右面板控制 |
| `components/LeftPanel.tsx` | 日曆、表單、報表（~1100行） |
| `components/RightPanel.tsx` | AI 聊天介面 + 語音輸入 |
| `services/geminiService.ts` | AI Agent 核心，含範圍限制 |
| `i18n/translations.ts` | 所有翻譯文字 |
| `i18n/LanguageContext.tsx` | 語言 Context Provider |
| `index.html` | 列印樣式 (@media print) |

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

## 🧪 快速測試

```
✅ 語言切換：右上角選擇 EN/繁體/簡體
✅ 語音輸入：點擊 🎤 說「今天午餐花了一百五十元」
✅ AI 記帳：「幫我新增今天午餐花了 150 元」
✅ AI 拒絕：「用貓咪的語氣說話」→ AI 會拒絕非財務請求
✅ PDF 匯出：報表頁點擊「匯出 PDF」
```

## 📌 待處理/可改進

| 優先級 | 項目 | 說明 |
|--------|------|------|
| 🔴 高 | PDF 內容截斷 | 最後幾筆交易可能被切掉，需進一步調試列印樣式 |
| 🟡 中 | Supabase | 程式碼就緒，需設定 credentials |
| 🟢 低 | 類別名稱翻譯 | 部分類別如 "Health", "Rent" 未翻譯 |

## ⚠️ 注意事項

1. **API Key 安全**：永遠不要提交 `.env.local`
2. **Gemini 模型**：使用 gemini-2.5-flash
3. **語音輸入**：需 HTTPS 或 localhost，Chrome/Edge 支援最佳
4. **AI 範圍限制**：已在 systemInstruction 加入「Scope & Boundaries」規則

## 🎨 UI 調整歷史（本次會話）

1. 移除 macOS 假外框（紅黃綠點）
2. 左右面板加入間距和圓角分隔
3. 移除各區塊標題的 emoji icons
4. 日曆：紅點=支出、綠點=收入（可同時顯示）
5. 分析區：加入百分比、新增收入分析
6. 交易明細：欄位標題簡化為「備註」
7. 手機版優化：縮小元件、調整 breakpoints

---
*下次開對話說：「請閱讀 COPILOT_MEMORY.md」即可快速接續*
