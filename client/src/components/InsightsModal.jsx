import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertTriangle, CheckCircle, PieChart, CalendarDays, Sparkles } from 'lucide-react';
import { formatRupee, formatMonthDisplay } from '../utils/formatters';

export default function InsightsModal({
  isOpen,
  onClose,
  currentMonth,
  summary,
  budgetLimit
}) {
  if (!isOpen) return null;

  const {
    totalIncome = 0,
    totalSpent = 0,
    balance = 0,
    saved = 0,
    savingsRate = 0,
    dailyAverage = 0,
    categoryBreakdown = {}
  } = summary || {};

  // Compute days left in month
  const today = new Date();
  const safeMonth = currentMonth || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthStr] = safeMonth.split('-');
  const year = parseInt(yearStr, 10) || today.getFullYear();
  const m = parseInt(monthStr, 10) || (today.getMonth() + 1);
  const totalDays = new Date(year, m, 0).getDate();
  let daysRemaining = 0;
  if (today.getFullYear() === year && (today.getMonth() + 1) === m) {
    daysRemaining = Math.max(1, totalDays - today.getDate());
  } else if (new Date(year, m - 1, 1) > today) {
    daysRemaining = totalDays;
  } else {
    daysRemaining = 0; // Past month
  }

  // Safe daily budget pacing
  const remainingBudget = budgetLimit > 0 ? Math.max(0, budgetLimit - totalSpent) : Math.max(0, balance);
  const safeDailySpend = daysRemaining > 0 ? Math.round(remainingBudget / daysRemaining) : 0;

  // Sorted categories
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1A1D21] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/60 dark:border-white/10 text-left max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Financial Insights
                </h3>
                <p className="text-xs text-slate-400">
                  {formatMonthDisplay(currentMonth)} Intelligence
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Business KPIs */}
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Daily Avg Spent</span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                {formatRupee(dailyAverage)} <span className="text-xs font-normal text-slate-400">/day</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Safe Daily Pacing</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {daysRemaining > 0 ? (
                  <>
                    {formatRupee(safeDailySpend)} <span className="text-xs font-normal text-slate-400">/day left</span>
                  </>
                ) : (
                  <span className="text-xs font-normal text-slate-400">Month concluded</span>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Savings Rate</span>
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">
                {savingsRate}%
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Remaining Budget</span>
              <p className={`text-lg font-bold mt-1 ${budgetLimit > 0 && totalSpent > budgetLimit ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>
                {budgetLimit > 0 ? formatRupee(remainingBudget) : 'No limit set'}
              </p>
            </div>
          </div>

          {/* AI / Smart Advice Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 my-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Smart Budget Advice
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {budgetLimit > 0 && totalSpent > budgetLimit ? (
                <>⚠️ You have exceeded your spending limit of {formatRupee(budgetLimit)} by {formatRupee(totalSpent - budgetLimit)}. Consider freezing non-essential expenses for the rest of {formatMonthDisplay(currentMonth)}.</>
              ) : savingsRate >= 30 ? (
                <>🎉 Fantastic money management! You have a {savingsRate}% savings rate, comfortably above the standard 20% benchmark.</>
              ) : daysRemaining > 0 && safeDailySpend > 0 ? (
                <>💡 To stay within your financial targets, limit your expenses to approx {formatRupee(safeDailySpend)} per day for the next {daysRemaining} days.</>
              ) : (
                <>Track everyday expenses right when they happen to get accurate daily velocity and budget forecasting.</>
              )}
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" /> Spending Breakdown
            </h4>

            {sortedCategories.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No expense entries recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map(([cat, amt]) => {
                  const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>{cat}</span>
                        <span>{formatRupee(amt)} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coral-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
