import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';
import { formatRupee, exportToPDF } from '../utils/formatters';

export default function BalanceRing({
  balance,
  income = 0,
  spent = 0,
  budgetLimit = 0,
  hasTransactions = false,
  transactions = [],
  currentMonth = '',
  summary = {},
  user = null
}) {
  const componentRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // Compute profit/loss
  const numIncome = Number(income || 0);
  const numSpent = Number(spent || 0);
  const computedProfit = Math.round((numIncome - numSpent) * 100) / 100;
  const displayBalance = balance !== undefined && !isNaN(balance) ? Math.round(Number(balance) * 100) / 100 : computedProfit;
  const isDeficit = displayBalance < 0;
  const absBalance = Math.abs(displayBalance);
  const effectiveHasTx = hasTransactions || (numIncome > 0 || numSpent > 0);

  const handleExportPdf = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      exportToPDF({
        transactions,
        monthStr: currentMonth,
        summary: {
          totalIncome: numIncome,
          totalSpent: numSpent,
          balance: displayBalance,
          ...summary
        },
        budgetLimit,
        user
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Unable to generate PDF. Please ensure transactions exist.');
    } finally {
      setIsExporting(false);
    }
  };

  // Compute progress percentage for the ring
  let percentage = 0;
  if (budgetLimit > 0) {
    percentage = Math.min(100, Math.round((numSpent / budgetLimit) * 100));
  } else if (numIncome > 0) {
    percentage = Math.min(100, Math.round((numSpent / numIncome) * 100));
  } else if (numSpent > 0) {
    percentage = 100;
  }

  // Dynamic subtitle message
  let statusMessage = "No entries yet";
  let statusColor = "text-slate-400 dark:text-slate-500";

  if (effectiveHasTx) {
    if (budgetLimit > 0 && numSpent > budgetLimit) {
      statusMessage = "Over budget! ⚠️";
      statusColor = "text-rose-500 font-semibold";
    } else if (displayBalance > 0 && numSpent === 0) {
      statusMessage = "Pure savings! 💰";
      statusColor = "text-emerald-500 font-semibold";
    } else if (displayBalance > 0) {
      statusMessage = "Safe & On Track ✨";
      statusColor = "text-teal-600 dark:text-teal-400 font-semibold";
    } else if (displayBalance < 0) {
      statusMessage = "Deficit balance 🔻";
      statusColor = "text-rose-500 font-semibold";
    } else {
      statusMessage = "Break-even ⚖️";
      statusColor = "text-slate-500 dark:text-slate-400";
    }
  }

  // Ring dimensions
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Ring stroke color: Red if deficit or over budget, Amber if >=80%, Emerald if safe
  let strokeColor = "#94A3B8"; // Sleek platinum default
  if (effectiveHasTx) {
    if (isDeficit || (budgetLimit > 0 && numSpent > budgetLimit)) {
      strokeColor = "#F43F5E"; // Red alert (deficit / over budget)
    } else if (percentage >= 80) {
      strokeColor = "#F59E0B"; // Amber warning
    } else {
      strokeColor = "#10B981"; // Emerald safe
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-4 select-none">
      <div ref={componentRef} className="relative flex items-center justify-center">
        {/* Liquid Wave Ripple Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full border border-slate-300/40 dark:border-white/10 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="w-96 h-96 rounded-full border border-slate-300/20 dark:border-zinc-700/20 animate-pulse" style={{ animationDuration: '6s' }} />
        </div>

        {/* 3D Liquid Glass Neumorphic Ring */}
        <motion.div
          whileHover={{ scale: 1.03, rotateX: 5, rotateY: -5 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full flex items-center justify-center neumorphic-liquid-ring water-glass transition-all duration-300 cursor-pointer group"
        >
          {/* Iridescent Liquid Sheen Effect */}
          <div className="absolute inset-2 rounded-full border border-white/80 dark:border-white/10 pointer-events-none" />

          {/* SVG Progress Arc */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background track circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-200/60 dark:text-slate-800/80"
              fill="transparent"
            />
            {/* Animated active progress arc */}
            {effectiveHasTx && (
              <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeLinecap="round"
                fill="transparent"
                style={{ filter: `drop-shadow(0 0 6px ${strokeColor}88)` }}
              />
            )}
          </svg>

          {/* Center Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-[210px]">
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-slate-400 dark:text-slate-400 font-bold mb-0.5">
              Current Balance
            </span>

            {/* Main Balance Display */}
            <motion.div
              key={displayBalance}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight my-1.5 ${
                isDeficit ? 'text-rose-500' : 'text-slate-900 dark:text-white'
              }`}
            >
              {formatRupee(displayBalance)}
            </motion.div>

            {/* Status Pill */}
            <span className={`text-[11px] sm:text-xs px-3 py-0.5 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-md transition-colors ${statusColor}`}>
              {statusMessage}
            </span>

            {/* Net Indicator */}
            {effectiveHasTx && (
              <span className={`text-[10px] mt-1.5 font-medium ${isDeficit ? 'text-rose-400' : displayBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {displayBalance > 0
                  ? `+${formatRupee(displayBalance)} Net Profit`
                  : displayBalance < 0
                  ? `-${formatRupee(absBalance)} Net Loss`
                  : '₹0 Net Balance'}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sleek Export PDF Action Pill Below Ring (Clean Black & White) */}
      <button
        onClick={handleExportPdf}
        disabled={isExporting}
        title="Download high-resolution official PDF financial statement"
        className="mt-3.5 flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 active:scale-95 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>{isExporting ? 'Generating Report...' : 'Download Statement (PDF)'}</span>
        <Download className="w-3 h-3 ml-0.5 opacity-80" />
      </button>
    </div>
  );
}
