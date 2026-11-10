import React from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun, BarChart3, Download, FileText, User, Sparkles } from 'lucide-react';
import { formatMonthDisplay } from '../utils/formatters';

export default function Header({
  currentMonth,
  onMonthChange,
  darkMode,
  onToggleDarkMode,
  onOpenInsights,
  onExportCSV,
  onExportPDF,
  user,
  onOpenAuth,
  onOpenProfile
}) {
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${y}-${m}`);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-4 z-40 px-4 md:px-8 max-w-4xl mx-auto w-full transition-all">
      <div className="water-glass water-glass-card rounded-3xl py-3 px-4 sm:px-6 flex items-center justify-between shadow-xl">
        {/* Month Navigator */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center space-x-1.5">
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors">
              {formatMonthDisplay(currentMonth)}
            </h1>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Action Buttons: User Auth, Insights, Export CSV & Dark Mode */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Insights Button */}
          <button
            onClick={onOpenInsights}
            title="Business Analytics & Insights"
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 border border-white/60 dark:border-white/10 shadow-xs"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            title="Export Month Statement as CSV"
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 border border-white/60 dark:border-white/10 shadow-xs"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Export PDF Button */}
          <button
            onClick={onExportPDF}
            title="Export Official PDF Financial Statement"
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 border border-white/60 dark:border-white/10 shadow-xs"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-full text-slate-700 dark:text-amber-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 border border-white/60 dark:border-white/10 shadow-xs"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* User Profile or Sign In Button */}
          {user ? (
            <button
              onClick={onOpenProfile}
              title={`Logged in as ${user.name}`}
              className="flex items-center space-x-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:scale-105 active:scale-95 transition-all text-xs font-bold"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-black">
                {getInitials(user.name)}
              </div>
              <span className="hidden sm:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 py-1.5 px-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
