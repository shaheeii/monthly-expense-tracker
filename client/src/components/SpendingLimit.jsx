import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { formatRupee } from '../utils/formatters';

export default function SpendingLimit({ limit, spent, onSaveLimit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(limit > 0 ? String(limit) : '');

  const handleOpenEdit = () => {
    setInputVal(limit > 0 ? String(limit) : '');
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanStr = String(inputVal).replace(/,/g, '').trim();
    const parsed = Math.max(0, Math.round((parseFloat(cleanStr) || 0) * 100) / 100);
    onSaveLimit(parsed);
    setIsEditing(false);
  };

  const hasLimit = limit > 0;
  const percentage = hasLimit ? Math.min(100, (spent / limit) * 100) : 0;
  const isOverBudget = hasLimit && spent > limit;
  const remaining = Math.max(0, limit - spent);

  let subtitle = "Set a limit to keep spending in check";
  if (hasLimit) {
    if (isOverBudget) {
      subtitle = `Over budget by ${formatRupee(spent - limit)}! ⚠️`;
    } else {
      subtitle = `${formatRupee(remaining)} remaining of your monthly target`;
    }
  }

  let barGradient = "from-emerald-400 to-teal-500";
  if (hasLimit) {
    if (isOverBudget) {
      barGradient = "from-rose-500 to-red-600";
    } else if (percentage > 80) {
      barGradient = "from-amber-400 to-orange-500";
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-3 p-4 sm:p-5 water-glass water-glass-card rounded-2xl shadow-lg transition-all text-left">
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          <span>Monthly Spending Limit</span>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-bold text-xs">₹</span>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-24 px-2 py-1 text-xs bg-white/90 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={handleOpenEdit}
            className="group flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
              {hasLimit ? formatRupee(limit) : 'None set'}
            </span>
            <Edit3 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Animated Liquid Wave Progress Bar */}
      <div className="relative w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden my-2.5 p-0.5">
        {hasLimit && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} wavy-progress-bar shadow-sm`}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <p className={`font-medium ${isOverBudget ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
          {subtitle}
        </p>
        {hasLimit && (
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}
