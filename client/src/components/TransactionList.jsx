import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Search, Utensils, Car, ShoppingBag, Zap, Film, HeartPulse, GraduationCap, Briefcase, Laptop, TrendingUp, Building, Gift, Tag, Sparkles, Receipt } from 'lucide-react';
import { formatRupee, formatDisplayDate } from '../utils/formatters';

const CATEGORY_ICON_MAP = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Zap,
  Entertainment: Film,
  Health: HeartPulse,
  Education: GraduationCap,
  Salary: Briefcase,
  Freelance: Laptop,
  Investment: TrendingUp,
  Business: Building,
  Gift: Gift,
  Other: Tag
};

export default function TransactionList({
  transactions,
  onDeleteTransaction,
  onEditTransaction
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const catStr = (t.category || '').toLowerCase();
    const noteStr = (t.note || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = catStr.includes(q) || noteStr.includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto pt-8 pb-16 text-left"
    >
      {/* Entries Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-2.5">
          <Receipt className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Monthly Entries
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            {transactions.length}
          </span>
        </div>

        {transactions.length > 0 && (
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 sm:w-44 pl-8 pr-3 py-1.5 text-xs bg-white/70 dark:bg-slate-800/80 rounded-full border border-white/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter pills */}
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-full text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-2 py-1 rounded-full font-bold transition-all ${
                  filterType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-rose-500'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-2 py-1 rounded-full font-bold transition-all ${
                  filterType === 'income'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-emerald-500'
                }`}
              >
                Income
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {transactions.length === 0 ? (
        <div className="water-glass rounded-3xl p-10 text-center text-slate-400 dark:text-slate-500 text-sm font-medium shadow-sm">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 animate-pulse" />
          No entries this month. Add one above.
        </div>
      ) : filtered.length === 0 ? (
        <div className="water-glass rounded-2xl p-6 text-center text-slate-400 text-sm">
          No entries matching your search.
        </div>
      ) : (
        /* Entries list with Scroll Stagger animations */
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((item, index) => {
              const isExpense = item.type === 'expense';
              const IconComponent = CATEGORY_ICON_MAP[item.category] || Tag;

              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -25, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="group relative flex items-center justify-between p-4 water-glass water-glass-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-default"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isExpense
                          ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.category}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                          {formatDisplayDate(item.date)}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Hover Actions */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`text-base sm:text-lg font-extrabold tracking-tight ${
                        isExpense
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'} {formatRupee(item.amount)}
                    </span>

                    {/* Quick Edit & Delete icons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(item)}
                        title="Edit entry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(item._id)}
                        title="Delete entry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
