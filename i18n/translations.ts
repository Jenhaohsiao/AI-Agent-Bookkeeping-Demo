// Multi-language translations
export type Language = 'en' | 'zh-TW' | 'zh-CN';

export const translations = {
  // ===== Header =====
  appTitle: {
    'en': 'Smart Ledger',
    'zh-TW': '智能記帳本',
    'zh-CN': '智能记账本',
  },
  appSubtitle: {
    'en': 'AI-Powered Ledger',
    'zh-TW': 'AI-Powered Ledger',
    'zh-CN': 'AI-Powered Ledger',
  },
  tabEntry: {
    'en': 'Entry',
    'zh-TW': '記帳',
    'zh-CN': '记账',
  },
  tabReport: {
    'en': 'Report',
    'zh-TW': '報表',
    'zh-CN': '报表',
  },

  // ===== Summary Cards =====
  income: {
    'en': 'Income',
    'zh-TW': '收入',
    'zh-CN': '收入',
  },
  expense: {
    'en': 'Expense',
    'zh-TW': '支出',
    'zh-CN': '支出',
  },
  balance: {
    'en': 'Balance',
    'zh-TW': '結餘',
    'zh-CN': '结余',
  },

  // ===== Form =====
  description: {
    'en': 'Note (max 15 chars)',
    'zh-TW': '備註（選填，最多15字）',
    'zh-CN': '备注（选填，最多15字）',
  },
  note: {
    'en': 'Note',
    'zh-TW': '備註',
    'zh-CN': '备注',
  },
  save: {
    'en': 'Save',
    'zh-TW': '儲存',
    'zh-CN': '保存',
  },
  update: {
    'en': 'Update',
    'zh-TW': '更新',
    'zh-CN': '更新',
  },
  cancel: {
    'en': 'Cancel',
    'zh-TW': '取消',
    'zh-CN': '取消',
  },

  // ===== Transactions =====
  transactionsOn: {
    'en': 'Transactions on',
    'zh-TW': '的交易',
    'zh-CN': '的交易',
  },
  noDescription: {
    'en': 'No description',
    'zh-TW': '無備註',
    'zh-CN': '无备注',
  },
  noTransactions: {
    'en': 'No transactions on this date',
    'zh-TW': '這天沒有交易記錄',
    'zh-CN': '这天没有交易记录',
  },
  records: {
    'en': 'records',
    'zh-TW': '筆',
    'zh-CN': '笔',
  },

  // ===== Report =====
  reportTitle: {
    'en': 'Financial Report',
    'zh-TW': '財務報表',
    'zh-CN': '财务报表',
  },
  exportPdf: {
    'en': 'Export PDF',
    'zh-TW': '匯出 PDF',
    'zh-CN': '导出 PDF',
  },
  thisWeek: {
    'en': 'This Week',
    'zh-TW': '本週',
    'zh-CN': '本周',
  },
  thisMonth: {
    'en': 'This Month',
    'zh-TW': '本月',
    'zh-CN': '本月',
  },
  thisYear: {
    'en': 'This Year',
    'zh-TW': '今年',
    'zh-CN': '今年',
  },
  customRange: {
    'en': 'Custom Range',
    'zh-TW': '自訂範圍',
    'zh-CN': '自定范围',
  },
  rangeTo: {
    'en': 'to',
    'zh-TW': '至',
    'zh-CN': '至',
  },
  today: {
    'en': 'Today',
    'zh-TW': '今天',
    'zh-CN': '今天',
  },
  weekdaysShort: {
    'en': ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    'zh-TW': ['日', '一', '二', '三', '四', '五', '六'],
    'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  },
  netIncome: {
    'en': 'Net Income',
    'zh-TW': '淨收入',
    'zh-CN': '净收入',
  },
  incomeBreakdown: {
    'en': 'Income Breakdown',
    'zh-TW': '收入分析',
    'zh-CN': '收入分析',
  },
  totalIncomeLabel: {
    'en': 'Total',
    'zh-TW': '總收入',
    'zh-CN': '总收入',
  },
  expenseBreakdown: {
    'en': 'Expense Breakdown',
    'zh-TW': '支出分析',
    'zh-CN': '支出分析',
  },
  totalExpenseLabel: {
    'en': 'Total',
    'zh-TW': '總支出',
    'zh-CN': '总支出',
  },
  trend: {
    'en': 'Monthly Trend',
    'zh-TW': '月度趨勢',
    'zh-CN': '月度趋势',
  },
  transactionList: {
    'en': 'Transaction List',
    'zh-TW': '交易明細',
    'zh-CN': '交易明细',
  },
  date: {
    'en': 'Date',
    'zh-TW': '日期',
    'zh-CN': '日期',
  },
  category: {
    'en': 'Category',
    'zh-TW': '類別',
    'zh-CN': '类别',
  },
  amount: {
    'en': 'Amount',
    'zh-TW': '金額',
    'zh-CN': '金额',
  },
  type: {
    'en': 'Type',
    'zh-TW': '類型',
    'zh-CN': '类型',
  },

  // ===== AI Chat =====
  aiTitle: {
    'en': 'AI Assistant',
    'zh-TW': 'AI 助理',
    'zh-CN': 'AI 助理',
  },
  aiSubtitle: {
    'en': 'Powered by Gemini',
    'zh-TW': 'Powered by Gemini',
    'zh-CN': 'Powered by Gemini',
  },
  aiGreeting: {
    'en': 'Hi! I\'m your AI Financial Assistant ✨',
    'zh-TW': '嗨！我是您的 AI 財務助理 ✨',
    'zh-CN': '嗨！我是您的 AI 财务助理 ✨',
  },
  aiHelpIntro: {
    'en': 'I can help you:',
    'zh-TW': '我可以幫您：',
    'zh-CN': '我可以帮您：',
  },
  aiHelp1: {
    'en': '📝 Record transactions',
    'zh-TW': '📝 記錄收支',
    'zh-CN': '📝 记录收支',
  },
  aiHelp2: {
    'en': '📊 Analyze spending',
    'zh-TW': '📊 分析消費',
    'zh-CN': '📊 分析消费',
  },
  aiHelp3: {
    'en': '📈 Generate reports',
    'zh-TW': '📈 生成報表',
    'zh-CN': '📈 生成报表',
  },
  aiPrompt: {
    'en': 'What would you like to do today?',
    'zh-TW': '請問今天想記什麼呢？',
    'zh-CN': '请问今天想记什么呢？',
  },
  inputPlaceholder: {
    'en': 'Type or tap mic to speak...',
    'zh-TW': '輸入訊息或點擊麥克風語音輸入...',
    'zh-CN': '输入消息或点击麦克风语音输入...',
  },
  aiDisclaimer: {
    'en': 'AI may make errors. Please verify important info.',
    'zh-TW': 'AI 可能會犯錯，請自行確認重要資訊',
    'zh-CN': 'AI 可能会犯错，请自行确认重要信息',
  },
  generateReport: {
    'en': 'Generate Report',
    'zh-TW': '生成報表',
    'zh-CN': '生成报表',
  },

  // ===== Mobile Tabs =====
  mobileTabLedger: {
    'en': '📊 Ledger',
    'zh-TW': '📊 記帳本',
    'zh-CN': '📊 记账本',
  },
  mobileTabAI: {
    'en': '🤖 AI Assistant',
    'zh-TW': '🤖 AI 助理',
    'zh-CN': '🤖 AI 助理',
  },

  // ===== Categories =====
  catFood: {
    'en': 'Food',
    'zh-TW': '餐飲',
    'zh-CN': '餐饮',
  },
  catTransport: {
    'en': 'Transport',
    'zh-TW': '交通',
    'zh-CN': '交通',
  },
  catShopping: {
    'en': 'Shopping',
    'zh-TW': '購物',
    'zh-CN': '购物',
  },
  catEntertainment: {
    'en': 'Entertainment',
    'zh-TW': '娛樂',
    'zh-CN': '娱乐',
  },
  catUtilities: {
    'en': 'Utilities',
    'zh-TW': '水電',
    'zh-CN': '水电',
  },
  catHealthcare: {
    'en': 'Healthcare',
    'zh-TW': '醫療',
    'zh-CN': '医疗',
  },
  catEducation: {
    'en': 'Education',
    'zh-TW': '教育',
    'zh-CN': '教育',
  },
  catHousing: {
    'en': 'Housing',
    'zh-TW': '住房',
    'zh-CN': '住房',
  },
  catTravel: {
    'en': 'Travel',
    'zh-TW': '旅遊',
    'zh-CN': '旅游',
  },
  catOther: {
    'en': 'Other',
    'zh-TW': '其他',
    'zh-CN': '其他',
  },
  catSalary: {
    'en': 'Salary',
    'zh-TW': '薪資',
    'zh-CN': '薪资',
  },
  catBonus: {
    'en': 'Bonus',
    'zh-TW': '獎金',
    'zh-CN': '奖金',
  },
  catInvestment: {
    'en': 'Investment',
    'zh-TW': '投資',
    'zh-CN': '投资',
  },
  catGift: {
    'en': 'Gift',
    'zh-TW': '禮金',
    'zh-CN': '礼金',
  },

  // ===== Language Names =====
  langEn: {
    'en': 'EN',
    'zh-TW': 'EN',
    'zh-CN': 'EN',
  },
  langZhTW: {
    'en': '繁體',
    'zh-TW': '繁體',
    'zh-CN': '繁体',
  },
  langZhCN: {
    'en': '简体',
    'zh-TW': '簡體',
    'zh-CN': '简体',
  },

  // ===== Print =====
  printFooter: {
    'en': 'Generated by Smart Ledger',
    'zh-TW': '由智能記帳本生成',
    'zh-CN': '由智能记账本生成',
  },

  // ===== Dialog =====
  confirmTextFormat: {
    'en': 'Confirm Text Format',
    'zh-TW': '確認文字格式',
    'zh-CN': '确认文字格式',
  },
  detectedChinese: {
    'en': 'Detected Chinese input:',
    'zh-TW': '偵測到中文輸入：',
    'zh-CN': '检测到中文输入：',
  },
  useSimplified: {
    'en': 'Use Simplified',
    'zh-TW': '使用簡體中文',
    'zh-CN': '使用简体中文',
  },
  useTraditional: {
    'en': 'Use Traditional',
    'zh-TW': '使用繁體中文',
    'zh-CN': '使用繁体中文',
  },
} as const;

// Helper function to get translation
export const t = (key: keyof typeof translations, lang: Language): string => {
  const value = translations[key][lang] || translations[key]['en'];
  // Handle array translations (return first element or empty string)
  if (Array.isArray(value)) {
    return (value as readonly string[])[0] || '';
  }
  return value as string;
};

// Helper function to get array translation (e.g., weekdaysShort)
export const tArray = (key: keyof typeof translations, lang: Language): string[] => {
  const value = translations[key][lang] || translations[key]['en'];
  if (Array.isArray(value)) {
    return [...(value as readonly string[])];
  }
  return [value as string];
};

// Category name mapping (internal key -> display name)
export const getCategoryName = (category: string, lang: Language): string => {
  const categoryMap: Record<string, keyof typeof translations> = {
    'Food': 'catFood',
    'Transport': 'catTransport',
    'Shopping': 'catShopping',
    'Entertainment': 'catEntertainment',
    'Utilities': 'catUtilities',
    'Healthcare': 'catHealthcare',
    'Education': 'catEducation',
    'Housing': 'catHousing',
    'Travel': 'catTravel',
    'Other': 'catOther',
    'Salary': 'catSalary',
    'Bonus': 'catBonus',
    'Investment': 'catInvestment',
    'Gift': 'catGift',
  };
  
  const key = categoryMap[category];
  if (key) {
    return t(key, lang);
  }
  return category; // Return original if not found
};
