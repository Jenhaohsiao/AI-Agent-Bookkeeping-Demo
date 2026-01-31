import React, { useState, useEffect, useMemo } from "react";
import { db } from "../services/dbService";
import { Transaction, ViewMode, ReportRange, TransactionType } from "../types";
import {
  Plus,
  Trash2,
  Edit2,
  Calendar as CalIcon,
  BarChart2,
  DollarSign,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfYear,
  endOfYear,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  endOfDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { CATEGORIES, CATEGORY_CONFIG } from "../constants";

// 千分位格式化函數
const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 圖表顏色
const CHART_COLORS = [
  "#f97316",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#10b981",
  "#eab308",
  "#6366f1",
  "#14b8a6",
  "#ef4444",
  "#6b7280",
];

interface LeftPanelProps {
  className?: string;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ className }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("entry");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );

  // Form State
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "expense",
    category: "Food",
    amount: "",
    description: "",
  });

  // Report State
  const [reportRange, setReportRange] = useState<ReportRange>("month");
  const [customStart, setCustomStart] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [customEnd, setCustomEnd] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );

  // Highlight State for AI-added transactions
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const refreshData = async () => {
    const data = await db.getAll();
    setTransactions(data);
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("db-update", handleUpdate);
    return () => window.removeEventListener("db-update", handleUpdate);
  }, []);

  // Listen for AI transaction events
  useEffect(() => {
    const handleAiAdd = (e: CustomEvent) => {
      const { date, id } = e.detail;
      // Switch to entry view and select the date
      setViewMode("entry");
      setSelectedDate(date);
      // Highlight the new transaction
      setHighlightedId(id);
      // Clear highlight after animation
      setTimeout(() => setHighlightedId(null), 3000);
    };

    const handleAiDelete = () => {
      // Just refresh, the item will be gone
      refreshData();
    };

    const handleAiPrint = (e: CustomEvent) => {
      // Switch to report view and trigger print after a short delay
      setViewMode("report");
      setTimeout(() => {
        window.print();
      }, 500);
    };

    window.addEventListener(
      "ai-transaction-added",
      handleAiAdd as EventListener,
    );
    window.addEventListener(
      "ai-transaction-deleted",
      handleAiDelete as EventListener,
    );
    window.addEventListener(
      "ai-print-report",
      handleAiPrint as EventListener,
    );

    return () => {
      window.removeEventListener(
        "ai-transaction-added",
        handleAiAdd as EventListener,
      );
      window.removeEventListener(
        "ai-transaction-deleted",
        handleAiDelete as EventListener,
      );
      window.removeEventListener(
        "ai-print-report",
        handleAiPrint as EventListener,
      );
    };
  }, []);

  // -- CRUD Handlers --
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    if (isEditing) {
      await db.update(isEditing, {
        type: formData.type as any,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: selectedDate,
      });
      setIsEditing(null);
    } else {
      await db.add({
        date: selectedDate,
        type: formData.type as any,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
      });
    }
    setFormData({
      type: "expense",
      category: "Food",
      amount: "",
      description: "",
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this record?")) {
      await db.delete(id);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setIsEditing(tx.id);
    setSelectedDate(tx.date);
    setFormData({
      type: tx.type,
      category: tx.category,
      amount: tx.amount.toString(),
      description: tx.description,
    });
    // Switch to entry view if not already
    setViewMode("entry");
  };

  // -- Derived Data --
  const dailyTransactions = transactions.filter((t) => t.date === selectedDate);
  const totalIncome = transactions.reduce(
    (sum, t) => (t.type === "income" ? sum + t.amount : sum),
    0,
  );
  const totalExpense = transactions.reduce(
    (sum, t) => (t.type === "expense" ? sum + t.amount : sum),
    0,
  );

  // -- Report Data Preparation --
  const { chartData, filteredTransactions, dateLabel } = useMemo(() => {
    // 1. Determine Date Range
    const refDate = parseISO(selectedDate);
    let start: Date, end: Date, label: string;

    if (reportRange === "week") {
      start = startOfWeek(refDate, { weekStartsOn: 1 }); // Monday start
      end = endOfWeek(refDate, { weekStartsOn: 1 });
      label = `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else if (reportRange === "month") {
      start = startOfMonth(refDate);
      end = endOfMonth(refDate);
      label = format(refDate, "MMMM yyyy");
    } else if (reportRange === "year") {
      start = startOfYear(refDate);
      end = endOfYear(refDate);
      label = format(refDate, "yyyy");
    } else {
      // Custom
      let d1 = parseISO(customStart);
      let d2 = parseISO(customEnd);

      // Validation safety
      if (isNaN(d1.getTime())) d1 = new Date();
      if (isNaN(d2.getTime())) d2 = new Date();

      if (d1 > d2) {
        start = d2;
        end = endOfDay(d1);
      } else {
        start = d1;
        end = endOfDay(d2);
      }
      label = `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
    }

    // 2. Filter Transactions
    const filtered = transactions
      .filter((t) => {
        const tDate = parseISO(t.date);
        return isWithinInterval(tDate, { start, end });
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort desc

    // 3. Aggregate for Charts
    const agg: Record<string, { income: number; expense: number }> = {};
    filtered.forEach((t) => {
      const key = t.category;
      if (!agg[key]) agg[key] = { income: 0, expense: 0 };
      if (t.type === "income") agg[key].income += t.amount;
      else agg[key].expense += t.amount;
    });

    const data = Object.keys(agg).map((k) => ({
      name: k,
      ...agg[k],
    }));

    return {
      chartData: data,
      filteredTransactions: filtered,
      dateLabel: label,
    };
  }, [transactions, reportRange, selectedDate, customStart, customEnd]);

  const handlePrint = () => {
    window.print();
  };

  // -- Components --

  const CalendarWidget = () => {
    const currentMonth = parseISO(selectedDate);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Get day of week for the first day (0 = Sunday)
    const firstDayOfWeek = start.getDay();

    // Generate year options (5 years back and forward)
    const currentYear = currentMonth.getFullYear();
    const yearOptions = Array.from(
      { length: 11 },
      (_, i) => currentYear - 5 + i,
    );

    // Month names
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const goToPrevMonth = () => {
      const newDate = subMonths(currentMonth, 1);
      setSelectedDate(format(newDate, "yyyy-MM-dd"));
    };

    const goToNextMonth = () => {
      const newDate = addMonths(currentMonth, 1);
      setSelectedDate(format(newDate, "yyyy-MM-dd"));
    };

    const goToToday = () => {
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMonth = parseInt(e.target.value);
      const newDate = new Date(currentMonth.getFullYear(), newMonth, 1);
      setSelectedDate(format(newDate, "yyyy-MM-dd"));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = parseInt(e.target.value);
      const newDate = new Date(newYear, currentMonth.getMonth(), 1);
      setSelectedDate(format(newDate, "yyyy-MM-dd"));
    };

    return (
      <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
        {/* Header with arrows and dropdowns */}
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 flex items-center justify-center hover:bg-amber-50 rounded-xl transition-colors text-gray-400 hover:text-amber-600"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={currentMonth.getMonth()}
              onChange={handleMonthChange}
              className="text-sm font-bold text-gray-800 bg-transparent border-none cursor-pointer hover:text-amber-600 focus:outline-none"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={currentMonth.getFullYear()}
              onChange={handleYearChange}
              className="text-sm font-bold text-gray-800 bg-transparent border-none cursor-pointer hover:text-amber-600 focus:outline-none"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={goToToday}
              className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium"
            >
              今天
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="w-8 h-8 flex items-center justify-center hover:bg-amber-50 rounded-xl transition-colors text-gray-400 hover:text-amber-600"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["日", "一", "二", "三", "四", "五", "六"].map((d, i) => (
            <div key={i} className="py-1 text-xs font-medium text-gray-400">
              {d}
            </div>
          ))}
          {/* Empty cells for days before the first of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          {days.map((d) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const hasData = transactions.some((t) => t.date === dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  relative w-full aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                  ${
                    isSelected
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg scale-105"
                      : isToday
                        ? "bg-amber-100 text-amber-700 font-bold ring-2 ring-amber-300"
                        : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                {format(d, "d")}
                {hasData && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full bg-gradient-to-br from-amber-50/50 via-white to-blue-50/50 ${className} overflow-hidden`}
    >
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white p-4 no-print">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg">智能記帳本</h1>
              <p className="text-xs text-amber-100">AI-Powered Ledger</p>
            </div>
          </div>
          <div className="flex bg-white/20 backdrop-blur rounded-xl p-1">
            <button
              onClick={() => setViewMode("entry")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "entry" ? "bg-white text-amber-600 shadow-lg" : "text-white/90 hover:bg-white/10"}`}
            >
              <CalIcon size={14} /> 記帳
            </button>
            <button
              onClick={() => setViewMode("report")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "report" ? "bg-white text-amber-600 shadow-lg" : "text-white/90 hover:bg-white/10"}`}
            >
              <BarChart2 size={14} /> 報表
            </button>
          </div>
        </div>

        {/* Balance Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-200" />
              <span className="text-xs text-amber-100">收入</span>
            </div>
            <p className="text-lg font-bold">${formatNumber(totalIncome)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={14} className="text-red-200" />
              <span className="text-xs text-amber-100">支出</span>
            </div>
            <p className="text-lg font-bold">${formatNumber(totalExpense)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-amber-200" />
              <span className="text-xs text-amber-100">結餘</span>
            </div>
            <p
              className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? "text-white" : "text-red-200"}`}
            >
              ${formatNumber(totalIncome - totalExpense)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {viewMode === "entry" && (
          <>
            {/* Calendar & Form Split - Stack on mobile, side-by-side on tablet+ */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="md:w-[40%]">
                <CalendarWidget />
              </div>

              {/* Add/Edit Form - Modern Style */}
              <div className="md:w-[60%] bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                {/* Type Selection with Icon - Same Row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Plus size={16} className="text-white" />
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: "expense",
                        category: CATEGORIES.expense[0],
                      })
                    }
                    className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      formData.type === "expense"
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <TrendingDown size={18} />
                    支出
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: "income",
                        category: CATEGORIES.income[0],
                      })
                    }
                    className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      formData.type === "income"
                        ? "bg-green-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <TrendingUp size={18} />
                    收入
                  </button>
                </div>

                {/* Responsive Layout: Stack on mobile, side-by-side on tablet+ */}
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Category Grid */}
                  <div className="md:w-[65%]">
                    <div className="grid grid-cols-4 gap-1.5">
                      {CATEGORIES[formData.type as TransactionType].map((c) => {
                        const config = CATEGORY_CONFIG[c] || {
                          icon: "📝",
                          color: "#6b7280",
                          bgColor: "#f3f4f6",
                        };
                        const isActive = formData.category === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, category: c })
                            }
                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                              isActive
                                ? "ring-2 ring-amber-400 shadow-md scale-105"
                                : "hover:scale-105"
                            }`}
                            style={{
                              backgroundColor: isActive
                                ? config.bgColor
                                : "#f9fafb",
                            }}
                          >
                            <span className="text-2xl mb-0.5">{config.icon}</span>
                            <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">
                              {c}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="md:w-[35%] flex flex-col gap-2">
                    {/* Amount Input */}
                    <div className="relative bg-gray-50 rounded-xl p-2">
                      <span className="text-gray-400 text-lg font-bold absolute left-2 top-1/2 -translate-y-1/2">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        required
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className="w-full pl-6 text-xl font-bold text-gray-800 bg-transparent border-none focus:outline-none text-center"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="備註 (選填，最多15字)"
                      maxLength={15}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                    />

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl"
                      >
                        {isEditing ? "更新" : "儲存"}
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(null)}
                          className="px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 font-medium"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Daily List - Modern */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                📅 {selectedDate} 的交易
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                  {dailyTransactions.length} 筆
                </span>
              </h3>

              <div className="space-y-3">
                {dailyTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-gray-400 text-sm">今日尚無交易記錄</p>
                  </div>
                ) : (
                  dailyTransactions.map((t) => {
                    const config = CATEGORY_CONFIG[t.category] || {
                      icon: "📝",
                      color: "#6b7280",
                      bgColor: "#f3f4f6",
                    };
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-3 rounded-xl group transition-all duration-300 hover:shadow-md
                          ${
                            highlightedId === t.id
                              ? "ring-2 ring-amber-400 bg-amber-50 animate-pulse"
                              : "bg-gray-50 hover:bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ backgroundColor: config.bgColor }}
                          >
                            {config.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {t.category}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t.description || "無備註"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-base font-bold ${t.type === "income" ? "text-green-500" : "text-red-500"}`}
                          >
                            {t.type === "income" ? "+" : "-"}$
                            {formatNumber(t.amount)}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(t)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Printable Report Section */}
        {viewMode === "report" && (
          <div className="space-y-6 printable-section">
            <div className="flex justify-between items-center no-print">
              <h2 className="text-lg font-bold text-gray-800">📊 財務報表</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-500 hover:to-orange-600 transition shadow-lg"
                >
                  <Download size={14} /> 匯出 PDF
                </button>
              </div>
            </div>

            {/* Summary Cards with Donut Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="font-bold text-gray-800 text-lg">
                  📈 {dateLabel}
                </h3>
                <div className="flex flex-wrap items-center gap-2 no-print">
                  <select
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-amber-200"
                    value={reportRange}
                    onChange={(e) =>
                      setReportRange(e.target.value as ReportRange)
                    }
                  >
                    <option value="week">本週</option>
                    <option value="month">本月</option>
                    <option value="year">今年</option>
                    <option value="custom">自訂範圍</option>
                  </select>

                  {reportRange === "custom" && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="text-sm border-none outline-none bg-transparent"
                      />
                      <span className="text-gray-400">至</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="text-sm border-none outline-none bg-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Main Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                      <TrendingUp size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      收入
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {formatNumber(
                      filteredTransactions.reduce(
                        (acc, t) =>
                          t.type === "income" ? acc + t.amount : acc,
                        0,
                      ),
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
                      <TrendingDown size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-red-700">
                      支出
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    $
                    {formatNumber(
                      filteredTransactions.reduce(
                        (acc, t) =>
                          t.type === "expense" ? acc + t.amount : acc,
                        0,
                      ),
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
                      <Wallet size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-amber-700">
                      結餘
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    $
                    {formatNumber(
                      filteredTransactions.reduce(
                        (acc, t) =>
                          t.type === "income" ? acc + t.amount : acc - t.amount,
                        0,
                      ),
                    )}
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-48 w-full print-compact">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} width={500} height={180}>
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${formatNumber(val)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                      name="收入"
                    />
                    <Bar
                      dataKey="expense"
                      fill="#ef4444"
                      radius={[8, 8, 0, 0]}
                      name="支出"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart - Modern Style */}
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4">
                🍩 支出分佈
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-48 h-48 print-compact">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart width={180} height={180}>
                      <Pie
                        data={chartData.filter((d) => d.expense > 0)}
                        dataKey="expense"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {chartData
                          .filter((d) => d.expense > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `$${formatNumber(value)}`}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs text-gray-400">總支出</p>
                    <p className="text-lg font-bold text-gray-800">
                      $
                      {formatNumber(
                        filteredTransactions.reduce(
                          (acc, t) =>
                            t.type === "expense" ? acc + t.amount : acc,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {chartData
                    .filter((d) => d.expense > 0)
                    .map((entry, index) => {
                      const config = CATEGORY_CONFIG[entry.name] || {
                        icon: "📝",
                      };
                      const totalExpense = filteredTransactions.reduce(
                        (acc, t) =>
                          t.type === "expense" ? acc + t.amount : acc,
                        0,
                      );
                      const percentage =
                        totalExpense > 0
                          ? ((entry.expense / totalExpense) * 100).toFixed(1)
                          : "0";
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center gap-2 p-2 rounded-xl bg-gray-50"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="text-sm">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {entry.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {percentage}%
                            </p>
                          </div>
                          <p className="text-xs font-bold text-gray-600">
                            ${formatNumber(entry.expense)}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            {/* Detailed Transaction List (流水帳) */}
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4">
                📋 交易明細
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">日期</th>
                      <th className="px-4 py-3">類別</th>
                      <th className="px-4 py-3">備註</th>
                      <th className="px-4 py-3 text-right rounded-r-xl">
                        金額
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          <div className="text-4xl mb-2">📭</div>
                          此期間無交易記錄
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => {
                        const config = CATEGORY_CONFIG[t.category] || {
                          icon: "📝",
                          bgColor: "#f3f4f6",
                        };
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-gray-50 hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {t.date}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"
                                style={{ backgroundColor: config.bgColor }}
                              >
                                {config.icon} {t.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {t.description || "-"}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-bold ${t.type === "income" ? "text-green-500" : "text-red-500"}`}
                            >
                              {t.type === "income" ? "+" : "-"}$
                              {formatNumber(t.amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block text-center text-xs text-gray-400 mt-8">
              由 智能記帳本 AI 生成於 {new Date().toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
