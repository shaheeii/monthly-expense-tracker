import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, Edit3 } from 'lucide-react';
import { toDateInputString } from '../utils/formatters';

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education'
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift'
];

export default function TransactionForm({ onAddTransaction, currentMonth }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [date, setDate] = useState(() => {
    const today = toDateInputString();
    if (currentMonth && !today.startsWith(currentMonth)) {
      return `${currentMonth}-01`;
    }
    return today;
  });
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync transaction form date when user navigates month
  useEffect(() => {
    if (currentMonth) {
      const today = toDateInputString();
      if (today.startsWith(currentMonth)) {
        setDate(today);
      } else {
        setDate(`${currentMonth}-01`);
      }
    }
  }, [currentMonth]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setIsCustom(false);
    setCustomCategory('');
    setCategory(newType === 'expense' ? 'Food' : 'Salary');
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setCategory(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmountStr = String(amount).replace(/,/g, '').trim();
    const numAmount = parseFloat(cleanAmountStr);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Use custom category if custom edit text is active
    const finalCategory = isCustom
      ? (customCategory.trim() || 'Other')
      : category;

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        type,
        amount: Math.round(numAmount * 100) / 100,
        category: finalCategory,
        date,
        note: note ? note.trim() : ''
      });
      setAmount('');
      setNote('');
      if (isCustom) {
        setCustomCategory('');
        setIsCustom(false);
        setCategory(type === 'expense' ? 'Food' : 'Salary');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto my-3 text-left"
    >
      <div className="water-glass water-glass-card rounded-3xl p-5 sm:p-7 shadow-xl border border-white/80 dark:border-white/10">
        {/* Card Header & Type Segmented Pill */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Add Transaction
            </h3>
          </div>

          {/* Type Toggle: Expense / Income */}
          <div className="flex p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Hero Input */}
          <div className="relative">
            <div className="flex items-baseline space-x-2 px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-500 transition-all">
              <span className="text-2xl font-extrabold text-slate-400 dark:text-slate-500 select-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full text-2xl sm:text-3xl font-extrabold bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Clean Dropdown with Edit Custom Text Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category
              </label>
              {isCustom && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setCustomCategory('');
                    setCategory(type === 'expense' ? 'Food' : 'Salary');
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                >
                  Back to standard list
                </button>
              )}
            </div>

            {/* Native Clean Select Dropdown */}
            <div className="relative">
              <select
                value={isCustom ? '__custom__' : category}
                onChange={handleDropdownChange}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer appearance-none"
              >
                <optgroup label="Standard Categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Custom Option">
                  <option value="__custom__">✏️ Custom Category (Edit text)...</option>
                </optgroup>
              </select>

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Animated Custom Category Input Box */}
            <AnimatePresence>
              {isCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-1.5"
                >
                  <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
                    <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Type custom category name..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      autoFocus
                      required
                      maxLength={30}
                      className="w-full text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date & Note in Two Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Date
              </label>
              <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch with team"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={60}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-2 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all duration-300 shadow-md cursor-pointer disabled:opacity-50 ${
              type === 'expense'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            {isSubmitting ? 'Recording...' : `+ Add ${type === 'expense' ? 'Expense' : 'Income'}`}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
