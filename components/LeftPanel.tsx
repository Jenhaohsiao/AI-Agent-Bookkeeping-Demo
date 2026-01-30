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
  Printer,
  ChevronLeft,
  ChevronRight,
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
import { CATEGORIES } from "../constants";

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

    window.addEventListener("ai-transaction-added", handleAiAdd as EventListener);
    window.addEventListener("ai-transaction-deleted", handleAiDelete as EventListener);
    
    return () => {
      window.removeEventListener("ai-transaction-added", handleAiAdd as EventListener);
      window.removeEventListener("ai-transaction-deleted", handleAiDelete as EventListener);
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
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        {/* Header with arrows and dropdowns */}
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title="Previous Month"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={currentMonth.getMonth()}
              onChange={handleMonthChange}
              className="text-sm font-semibold text-gray-700 bg-transparent border border-gray-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-50"
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
              className="text-sm font-semibold text-gray-700 bg-transparent border border-gray-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-50"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={goToToday}
              className="text-xs text-blue-500 hover:text-blue-700 hover:underline ml-1"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title="Next Month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <div key={i} className="py-1 font-medium">
              {d.charAt(0)}
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
                                p-2 rounded-lg transition-colors relative
                                ${isSelected ? "bg-blue-500 text-white" : isToday ? "bg-blue-100 text-blue-700 font-bold" : "hover:bg-gray-100 text-gray-700"}
                            `}
              >
                {format(d, "d")}
                {hasData && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-400 rounded-full"></div>
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
      className={`flex flex-col h-full bg-gray-50/50 ${className} overflow-hidden`}
    >
      {/* Top Nav - Hidden on print */}
      <div className="flex items-center space-x-4 p-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 no-print">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("entry")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "entry" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <span className="flex items-center gap-2">
              <CalIcon size={14} /> Entry
            </span>
          </button>
          <button
            onClick={() => setViewMode("report")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "report" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <span className="flex items-center gap-2">
              <BarChart2 size={14} /> Report
            </span>
          </button>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          Balance:{" "}
          <span
            className={`font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            ${(totalIncome - totalExpense).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {viewMode === "entry" && (
          <>
            {/* Calendar & Form Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CalendarWidget />

              {/* Add/Edit Form */}
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {isEditing ? "Edit Transaction" : "New Transaction"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-2 border rounded-lg text-sm bg-gray-50"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value,
                          category:
                            CATEGORIES[e.target.value as TransactionType][0],
                        })
                      }
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                    <select
                      className="flex-1 p-2 border rounded-lg text-sm bg-gray-50"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {CATEGORIES[formData.type as TransactionType].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      required
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full pl-8 p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {isEditing ? "Update" : "Add"}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(null)}
                        className="px-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm text-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Daily List */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                Records for {selectedDate}
                <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                  {dailyTransactions.length} items
                </span>
              </h3>

              <div className="space-y-2">
                {dailyTransactions.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">
                    No transactions.
                  </p>
                ) : (
                  dailyTransactions.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group border transition-all duration-500
                        ${highlightedId === t.id 
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300 ring-opacity-50 animate-pulse" 
                          : "border-gray-100"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                        >
                          {t.type === "income" ? (
                            <Plus size={16} />
                          ) : (
                            <span className="font-bold text-lg leading-none">
                              -
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {t.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}
                        >
                          {t.type === "income" ? "+" : "-"}$
                          {t.amount.toFixed(2)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
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
                Financial Report
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition"
                >
                  <Download size={14} /> Export PDF
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="font-bold text-gray-700">
                  Summary: {dateLabel}
                </h3>
                <div className="flex flex-wrap items-center gap-2 no-print">
                  <select
                    className="text-sm border rounded p-1 bg-white"
                    value={reportRange}
                    onChange={(e) =>
                      setReportRange(e.target.value as ReportRange)
                    }
                  >
                    <option value="week">Week (Selected)</option>
                    <option value="month">Month (Selected)</option>
                    <option value="year">Year (Selected)</option>
                    <option value="custom">Custom Range</option>
                  </select>

                  {reportRange === "custom" && (
                    <div className="flex items-center gap-1 bg-white p-1 rounded border">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="text-xs border-none outline-none bg-transparent"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="text-xs border-none outline-none bg-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="income"
                      fill="#4ade80"
                      radius={[4, 4, 0, 0]}
                      name="Income"
                    />
                    <Bar
                      dataKey="expense"
                      fill="#f87171"
                      radius={[4, 4, 0, 0]}
                      name="Expense"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4">Distribution</h3>
                <div className="h-48 w-full flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter((d) => d.expense > 0)}
                        dataKey="expense"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              ["#f87171", "#fbbf24", "#60a5fa", "#a78bfa"][
                                index % 4
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Text Stats */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 uppercase font-semibold">
                    Total Income
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    $
                    {filteredTransactions
                      .reduce(
                        (acc, t) =>
                          t.type === "income" ? acc + t.amount : acc,
                        0,
                      )
                      .toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 uppercase font-semibold">
                    Total Expense
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    $
                    {filteredTransactions
                      .reduce(
                        (acc, t) =>
                          t.type === "expense" ? acc + t.amount : acc,
                        0,
                      )
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Transaction List (流水帳) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4">
                Detailed Transactions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">
                        Amount
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
                          No transactions found for this period.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {t.date}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {t.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {t.description || "-"}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}
                          >
                            {t.type === "income" ? "+" : "-"}$
                            {t.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block text-center text-xs text-gray-400 mt-8">
              Generated by Gemini Ledger Agent on{" "}
              {new Date().toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
