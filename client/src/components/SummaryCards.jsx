import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import { formatRupee } from '../utils/formatters';

export default function SummaryCards({ income, spent, saved }) {
  const cards = [
    {
      title: 'Income',
      amount: income,
      display: formatRupee(income || 0),
      color: 'text-emerald-600 dark:text-emerald-400',
      icon: ArrowDownLeft,
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      glow: 'hover:shadow-emerald-500/20'
    },
    {
      title: 'Spent',
      amount: spent,
      display: formatRupee(spent || 0),
      color: 'text-rose-500 dark:text-rose-400',
      icon: ArrowUpRight,
      iconBg: 'bg-rose-500/15 text-rose-500 dark:text-rose-400',
      glow: 'hover:shadow-rose-500/20'
    },
    {
      title: 'Saved',
      amount: saved,
      display: formatRupee(saved !== undefined && !isNaN(saved) ? Math.max(0, saved) : 0),
      color: 'text-zinc-700 dark:text-zinc-200',
      icon: PiggyBank,
      iconBg: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
      glow: 'hover:shadow-zinc-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 w-full max-w-2xl mx-auto py-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={`water-glass water-glass-card rounded-2xl p-4 sm:p-5 flex items-center space-x-3.5 shadow-lg ${card.glow} transition-all duration-300`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} backdrop-blur-md`}>
              <Icon className="w-5 h-5 stroke-[2.3]" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                {card.title}
              </span>
              <motion.span
                key={card.amount}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-lg sm:text-xl font-extrabold truncate ${card.color}`}
              >
                {card.display}
              </motion.span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
