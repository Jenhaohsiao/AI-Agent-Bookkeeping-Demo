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
import { useLanguage } from "../i18n";

// Format number with thousands separators
const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Chart colors
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
  const { t, tArray, getCategoryName, language } = useLanguage();

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
      const { dateStart, dateEnd } = e.detail;
      // Set custom date range from AI parameters
      if (dateStart && dateEnd) {
        setReportRange("custom");
        setCustomStart(dateStart);
        setCustomEnd(dateEnd);
      }
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
    window.addEventListener("ai-print-report", handleAiPrint as EventListener);

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
      <div className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
        {/* Header with arrows and dropdowns */}
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={goToPrevMonth}
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-amber-50 rounded-lg md:rounded-xl transition-colors text-gray-400 hover:text-amber-600"
            title="Previous Month"
          >
            <ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />
          </button>

          <div className="flex items-center gap-1 md:gap-2">
            <select
              value={currentMonth.getMonth()}
              onChange={handleMonthChange}
              className="text-xs md:text-sm font-bold text-gray-800 bg-transparent border-none cursor-pointer hover:text-amber-600 focus:outline-none"
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
              className="text-xs md:text-sm font-bold text-gray-800 bg-transparent border-none cursor-pointer hover:text-amber-600 focus:outline-none"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={goToToday}
              className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs bg-amber-100 text-amber-700 rounded-md md:rounded-lg hover:bg-amber-200 font-medium"
            >
              {t("today")}
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-amber-50 rounded-lg md:rounded-xl transition-colors text-gray-400 hover:text-amber-600"
            title="Next Month"
          >
            <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {tArray("weekdaysShort").map((d, i) => (
            <div
              key={i}
              className="py-0.5 md:py-1 text-[10px] md:text-xs font-medium text-gray-400"
            >
              {d}
            </div>
          ))}
          {/* Empty cells for days before the first of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-1 md:p-2"></div>
          ))}
          {days.map((d) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const dayTransactions = transactions.filter(
              (t) => t.date === dateStr,
            );
            const hasIncome = dayTransactions.some((t) => t.type === "income");
            const hasExpense = dayTransactions.some(
              (t) => t.type === "expense",
            );
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  relative w-full aspect-square flex items-center justify-center rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all
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
                {(hasIncome || hasExpense) && (
                  <div className="absolute bottom-0.5 md:bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {hasExpense && (
                      <div
                        className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? "bg-red-200" : "bg-red-400"}`}
                      ></div>
                    )}
                    {hasIncome && (
                      <div
                        className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? "bg-green-200" : "bg-green-400"}`}
                      ></div>
                    )}
                  </div>
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
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white p-3 md:p-4 no-print">
        <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
          <div className="min-w-0 flex-shrink">
            <h1 className="font-bold text-sm md:text-lg truncate">
              {t("appTitle")}
            </h1>
            <p className="text-[10px] md:text-xs text-amber-100 truncate">
              {t("appSubtitle")}
            </p>
          </div>
          <div className="flex bg-white/20 backdrop-blur rounded-xl p-0.5 md:p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode("entry")}
              className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1 md:gap-2 ${viewMode === "entry" ? "bg-white text-amber-600 shadow-lg" : "text-white/90 hover:bg-white/10"}`}
            >
              <CalIcon size={12} className="md:w-3.5 md:h-3.5" />{" "}
              <span className="hidden sm:inline">{t("tabEntry")}</span>
              <span className="sm:hidden">📝</span>
            </button>
            <button
              onClick={() => setViewMode("report")}
              className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1 md:gap-2 ${viewMode === "report" ? "bg-white text-amber-600 shadow-lg" : "text-white/90 hover:bg-white/10"}`}
            >
              <BarChart2 size={12} className="md:w-3.5 md:h-3.5" />{" "}
              <span className="hidden sm:inline">{t("tabReport")}</span>
              <span className="sm:hidden">📊</span>
            </button>
          </div>
        </div>

        {/* Balance Summary Cards - Compact */}
        <div className="flex gap-2 md:gap-3 text-xs md:text-sm">
          <div className="flex-1 bg-white/20 backdrop-blur rounded-lg px-2 py-1.5 md:px-3 md:py-2 min-w-0">
            <span className="text-amber-100 mr-1">{t("income")}</span>
            <span className="font-bold">${formatNumber(totalIncome)}</span>
          </div>
          <div className="flex-1 bg-white/20 backdrop-blur rounded-lg px-2 py-1.5 md:px-3 md:py-2 min-w-0">
            <span className="text-amber-100 mr-1">{t("expense")}</span>
            <span className="font-bold">${formatNumber(totalExpense)}</span>
          </div>
          <div className="flex-1 bg-white/20 backdrop-blur rounded-lg px-2 py-1.5 md:px-3 md:py-2 min-w-0">
            <span className="text-amber-100 mr-1">{t("balance")}</span>
            <span
              className={`font-bold ${totalIncome - totalExpense >= 0 ? "text-white" : "text-red-200"}`}
            >
              ${formatNumber(totalIncome - totalExpense)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 custom-scrollbar">
        {viewMode === "entry" && (
          <>
            {/* Calendar & Form - Stack vertically on mobile */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Calendar - Full width on mobile */}
              <div className="w-full lg:w-[40%] flex-shrink-0">
                <CalendarWidget />
              </div>

              {/* Add/Edit Form */}
              <div className="w-full lg:w-[60%] bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
                {/* Type Selection */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Plus size={14} className="text-white md:w-4 md:h-4" />
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
                    className={`flex-1 py-2 rounded-lg md:rounded-xl font-medium transition-all flex items-center justify-center gap-1 text-xs md:text-sm ${
                      formData.type === "expense"
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <TrendingDown size={14} />
                    {t("expense")}
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
                    className={`flex-1 py-2 rounded-lg md:rounded-xl font-medium transition-all flex items-center justify-center gap-1 text-xs md:text-sm ${
                      formData.type === "income"
                        ? "bg-green-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <TrendingUp size={14} />
                    {t("income")}
                  </button>
                </div>

                {/* Category Grid - Always on top, form below */}
                <div className="grid grid-cols-5 gap-1 mb-3">
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
                        className={`flex flex-col items-center justify-center p-1 md:p-1.5 rounded-lg transition-all ${
                          isActive
                            ? "ring-2 ring-amber-400 shadow-md"
                            : "hover:bg-gray-100"
                        }`}
                        style={{
                          backgroundColor: isActive
                            ? config.bgColor
                            : "#f9fafb",
                        }}
                      >
                        <span className="text-base md:text-xl">
                          {config.icon}
                        </span>
                        <span className="text-[7px] md:text-[9px] font-medium text-gray-600 truncate w-full text-center leading-tight">
                          {getCategoryName(c)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Form Fields - Horizontal on mobile */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {/* Amount Input */}
                    <div className="relative bg-gray-50 rounded-lg flex-1">
                      <span className="text-gray-400 text-sm font-bold absolute left-2 top-1/2 -translate-y-1/2">
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
                        className="w-full py-2 pl-6 pr-2 text-base font-bold text-gray-800 bg-transparent border-none focus:outline-none"
                      />
                    </div>
                    {/* Description */}
                    <input
                      type="text"
                      placeholder={t("description")}
                      maxLength={15}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-2 rounded-lg text-sm font-bold transition-all shadow-lg"
                    >
                      {isEditing ? t("update") : t("save")}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(null)}
                        className="px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 font-medium"
                      >
                        {t("cancel")}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Daily List */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-3 md:p-4">
              <h3 className="text-sm md:text-base font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2 flex-wrap">
                <span>📅 {selectedDate}</span>
                <span className="text-gray-500 font-normal">
                  {t("transactionsOn")}
                </span>
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {dailyTransactions.length} {t("records")}
                </span>
              </h3>

              <div className="space-y-2">
                {dailyTransactions.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-gray-400 text-xs md:text-sm">
                      {t("noTransactions")}
                    </p>
                  </div>
                ) : (
                  dailyTransactions.map((tx) => {
                    const config = CATEGORY_CONFIG[tx.category] || {
                      icon: "📝",
                      color: "#6b7280",
                      bgColor: "#f3f4f6",
                    };
                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl group transition-all duration-300 hover:shadow-md
                          ${
                            highlightedId === tx.id
                              ? "ring-2 ring-amber-400 bg-amber-50 animate-pulse"
                              : "bg-gray-50 hover:bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <div
                            className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg flex-shrink-0"
                            style={{ backgroundColor: config.bgColor }}
                          >
                            {config.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs md:text-sm font-semibold text-gray-800 truncate">
                              {getCategoryName(tx.category)}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-400 truncate">
                              {tx.description || t("noDescription")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-sm md:text-base font-bold ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}
                          >
                            {tx.type === "income" ? "+" : "-"}$
                            {formatNumber(tx.amount)}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(tx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
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
              <h2 className="text-lg font-bold text-gray-800">
                {t("reportTitle")}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-500 hover:to-orange-600 transition shadow-lg"
                >
                  <Download size={14} /> {t("exportPdf")}
                </button>
              </div>
            </div>

            {/* Summary Cards with Donut Chart */}
            <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <h3 className="font-bold text-gray-800 text-sm md:text-lg truncate">
                  {dateLabel}
                </h3>
                <div className="flex flex-wrap items-center gap-2 no-print">
                  <select
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-amber-200"
                    value={reportRange}
                    onChange={(e) =>
                      setReportRange(e.target.value as ReportRange)
                    }
                  >
                    <option value="week">{t("thisWeek")}</option>
                    <option value="month">{t("thisMonth")}</option>
                    <option value="year">{t("thisYear")}</option>
                    <option value="custom">{t("customRange")}</option>
                  </select>

                  {reportRange === "custom" && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="text-sm border-none outline-none bg-transparent"
                      />
                      <span className="text-gray-400">{t("rangeTo")}</span>
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

              {/* Main Stats Row - Compact */}
              <div className="flex flex-wrap gap-2 text-xs md:text-sm mb-4">
                <div className="flex-1 min-w-[80px] bg-green-50 rounded-lg px-2 py-1.5 whitespace-nowrap">
                  <span className="text-green-600">{t("income")} </span>
                  <span className="font-bold text-green-700">
                    $
                    {formatNumber(
                      filteredTransactions.reduce(
                        (acc, tx) =>
                          tx.type === "income" ? acc + tx.amount : acc,
                        0,
                      ),
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-[80px] bg-red-50 rounded-lg px-2 py-1.5 whitespace-nowrap">
                  <span className="text-red-600">{t("expense")} </span>
                  <span className="font-bold text-red-700">
                    $
                    {formatNumber(
                      filteredTransactions.reduce(
                        (acc, tx) =>
                          tx.type === "expense" ? acc + tx.amount : acc,
                        0,
                      ),
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-[80px] bg-amber-50 rounded-lg px-2 py-1.5 whitespace-nowrap">
                  <span className="text-amber-600">{t("balance")} </span>
                  <span className="font-bold text-amber-700">
                    $
                    {formatNumber(
                      filteredTransactions.reduce(
                        (acc, tx) =>
                          tx.type === "income"
                            ? acc + tx.amount
                            : acc - tx.amount,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Donut Chart - Modern Style */}
            <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-3 md:mb-4">
                {t("expenseBreakdown")}
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                {/* Donut Chart - Hidden in print */}
                <div className="relative w-32 h-32 md:w-48 md:h-48 print-compact flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter((d) => d.expense > 0)}
                        dataKey="expense"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="70%"
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
                    <p className="text-[10px] md:text-xs text-gray-400">
                      {t("totalExpenseLabel")}
                    </p>
                    <p className="text-sm md:text-lg font-bold text-gray-800">
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

                {/* Legend - Full width in print */}
                <div className="w-full md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2 max-h-48 md:max-h-none overflow-y-auto print-legend-full">
                  {chartData
                    .filter((d) => d.expense > 0)
                    .map((entry, index) => {
                      const config = CATEGORY_CONFIG[entry.name] || {
                        icon: "📝",
                      };
                      const totalExpense = filteredTransactions.reduce(
                        (acc, tx) =>
                          tx.type === "expense" ? acc + tx.amount : acc,
                        0,
                      );
                      const percentage =
                        totalExpense > 0
                          ? ((entry.expense / totalExpense) * 100).toFixed(1)
                          : "0";
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center gap-1.5 p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gray-50 text-xs"
                        >
                          <span className="flex-shrink-0">{config.icon}</span>
                          <span className="font-medium text-gray-700 truncate flex-1">
                            {getCategoryName(entry.name)}
                          </span>
                          <span className="text-gray-400 flex-shrink-0">
                            {percentage}%
                          </span>
                          <span className="font-bold text-gray-600 flex-shrink-0">
                            ${formatNumber(entry.expense)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Income Breakdown - Donut Chart */}
            <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-3 md:mb-4">
                {t("incomeBreakdown")}
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                {/* Donut Chart - Hidden in print */}
                <div className="relative w-32 h-32 md:w-48 md:h-48 print-compact flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter((d) => d.income > 0)}
                        dataKey="income"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="70%"
                        paddingAngle={3}
                      >
                        {chartData
                          .filter((d) => d.income > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-income-${index}`}
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
                    <p className="text-[10px] md:text-xs text-gray-400">
                      {t("totalIncomeLabel")}
                    </p>
                    <p className="text-sm md:text-lg font-bold text-green-600">
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
                </div>

                {/* Legend - Full width in print */}
                <div className="w-full md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2 max-h-48 md:max-h-none overflow-y-auto print-legend-full">
                  {chartData
                    .filter((d) => d.income > 0)
                    .map((entry, index) => {
                      const config = CATEGORY_CONFIG[entry.name] || {
                        icon: "📝",
                      };
                      const totalIncome = filteredTransactions.reduce(
                        (acc, tx) =>
                          tx.type === "income" ? acc + tx.amount : acc,
                        0,
                      );
                      const percentage =
                        totalIncome > 0
                          ? ((entry.income / totalIncome) * 100).toFixed(1)
                          : "0";
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center gap-1.5 p-1.5 md:p-2 rounded-lg md:rounded-xl bg-green-50 text-xs"
                        >
                          <span className="flex-shrink-0">{config.icon}</span>
                          <span className="font-medium text-gray-700 truncate flex-1">
                            {getCategoryName(entry.name)}
                          </span>
                          <span className="text-gray-400 flex-shrink-0">
                            {percentage}%
                          </span>
                          <span className="font-bold text-green-600 flex-shrink-0">
                            ${formatNumber(entry.income)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Detailed Transaction List (流水帳) */}
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4">
                {t("transactionList")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">{t("date")}</th>
                      <th className="px-4 py-3">{t("category")}</th>
                      <th className="px-4 py-3">{t("note")}</th>
                      <th className="px-4 py-3 text-right rounded-r-xl">
                        {t("amount")}
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
                          {t("noTransactions")}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const config = CATEGORY_CONFIG[tx.category] || {
                          icon: "📝",
                          bgColor: "#f3f4f6",
                        };
                        return (
                          <tr
                            key={tx.id}
                            className="border-b border-gray-50 hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {tx.date}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"
                                style={{ backgroundColor: config.bgColor }}
                              >
                                {config.icon} {getCategoryName(tx.category)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {tx.description || "-"}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-bold ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}
                            >
                              {tx.type === "income" ? "+" : "-"}$
                              {formatNumber(tx.amount)}
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
              {t("printFooter")} - {new Date().toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
