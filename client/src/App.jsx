import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import BackgroundAura from './components/BackgroundAura';
import GoldWaterSmoke from './components/GoldWaterSmoke';
import BalanceRing from './components/BalanceRing';
import SummaryCards from './components/SummaryCards';
import SpendingLimit from './components/SpendingLimit';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import EditModal from './components/EditModal';
import InsightsModal from './components/InsightsModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { exportToCSV, exportToPDF } from './utils/formatters';

const API_BASE = '/api';

export default function App() {
  const getInitialMonth = () => {
    const saved = localStorage.getItem('expense_tracker_active_month');
    if (saved) return saved;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth);
  const [darkMode, setDarkMode] = useState(false);

  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
    localStorage.setItem('expense_tracker_active_month', newMonth);
  };

  // Authentication state
  const [token, setToken] = useState(() => localStorage.getItem('expense_tracker_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('expense_tracker_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalSpent: 0,
    balance: 0,
    saved: 0,
    savingsRate: 0,
    dailyAverage: 0,
    categoryBreakdown: {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Sync dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Login / Registration success
  const handleAuthSuccess = (newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('expense_tracker_token', newToken);
    localStorage.setItem('expense_tracker_user', JSON.stringify(newUser));
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('expense_tracker_token');
    localStorage.removeItem('expense_tracker_user');
    setTransactions([]);
    setBudgetLimit(0);
    setSummary({
      totalIncome: 0,
      totalSpent: 0,
      balance: 0,
      saved: 0,
      savingsRate: 0,
      dailyAverage: 0,
      categoryBreakdown: {}
    });
  };

  // Auth Header helper
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  // Fetch transactions, budget, and summary
  const fetchData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      const [txRes, bgRes, smRes] = await Promise.all([
        fetch(`${API_BASE}/transactions?month=${currentMonth}`, {
          headers: authHeaders
        }),
        fetch(`${API_BASE}/budget?month=${currentMonth}`, {
          headers: authHeaders
        }),
        fetch(`${API_BASE}/transactions/summary?month=${currentMonth}`, {
          headers: authHeaders
        })
      ]);

      if (txRes.status === 401 || bgRes.status === 401 || smRes.status === 401) {
        handleLogout();
        setIsAuthOpen(true);
        return;
      }

      if (txRes.status === 403 || bgRes.status === 403 || smRes.status === 403) {
        handleLogout();
        alert('Your account has been suspended or blocked by an administrator.');
        return;
      }

      const txJson = await txRes.json();
      const txList = txJson.success ? (txJson.data || []) : [];
      setTransactions(txList);

      const bgJson = await bgRes.json();
      if (bgJson.success) setBudgetLimit(bgJson.data?.limit || 0);

      const smJson = await smRes.json();
      if (smJson.success && smJson.data) {
        setSummary(smJson.data);
      } else {
        // Instant direct calculation fallback
        let totalIncome = 0;
        let totalSpent = 0;
        const catMap = {};
        txList.forEach((t) => {
          const a = Number(t.amount) || 0;
          if (t.type === 'income') totalIncome += a;
          else {
            totalSpent += a;
            catMap[t.category] = (catMap[t.category] || 0) + a;
          }
        });
        const bal = totalIncome - totalSpent;
        setSummary({
          totalIncome,
          totalSpent,
          balance: bal,
          saved: Math.max(0, bal),
          savingsRate: totalIncome > 0 ? Math.round((Math.max(0, bal) / totalIncome) * 100) : 0,
          dailyAverage: 0,
          categoryBreakdown: catMap
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      // Prompt user to login if not logged in
      setIsAuthOpen(true);
    }
  }, [currentMonth, token]);

  const handleAddTransaction = async (data) => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data)
      });
      if (res.status === 403) {
        handleLogout();
        alert('Your account has been suspended or blocked.');
        return;
      }
      const json = await res.json();
      if (json.success) {
        if (data.type === 'income') {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
        const txMonth = data.date ? data.date.slice(0, 7) : currentMonth;
        if (txMonth !== currentMonth) {
          handleMonthChange(txMonth);
        } else {
          await fetchData();
        }
      }
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const handleSaveEdit = async (id, updatedData) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updatedData)
      });
      if (res.status === 403) {
        handleLogout();
        alert('Your account has been suspended or blocked.');
        return;
      }
      const json = await res.json();
      if (json.success) {
        const txMonth = updatedData.date ? updatedData.date.slice(0, 7) : currentMonth;
        if (txMonth !== currentMonth) {
          handleMonthChange(txMonth);
        } else {
          await fetchData();
        }
      }
    } catch (err) {
      console.error('Failed to update transaction:', err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.status === 403) {
        handleLogout();
        alert('Your account has been suspended or blocked.');
        return;
      }
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleSaveLimit = async (newLimit) => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/budget`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ month: currentMonth, limit: newLimit })
      });
      if (res.status === 403) {
        handleLogout();
        alert('Your account has been suspended or blocked.');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setBudgetLimit(newLimit);
        const smRes = await fetch(`${API_BASE}/transactions/summary?month=${currentMonth}`, {
          headers: authHeaders
        });
        const smJson = await smRes.json();
        if (smJson.success) setSummary(smJson.data);
      }
    } catch (err) {
      console.error('Failed to save budget limit:', err);
    }
  };

  const scrollToDashboard = () => {
    const el = document.getElementById('action-dashboard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative min-h-screen ${darkMode ? 'dark dark-theme-bg text-slate-100' : 'light-theme-bg text-slate-800'}`}>
      {/* Smoky Liquid Background Aura */}
      <BackgroundAura darkMode={darkMode} />

      {/* Interactive Golden Water Smoke Cursor Trail */}
      <GoldWaterSmoke />

      {/* Top Floating Glass Header */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenInsights={() => setIsInsightsOpen(true)}
        onExportCSV={() => exportToCSV({ transactions, monthStr: currentMonth, summary, budgetLimit, user })}
        onExportPDF={() => exportToPDF({ transactions, monthStr: currentMonth, summary, budgetLimit, user })}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Flowing Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        
        {/* Not Logged In Notice Bar */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-2xl water-glass border border-amber-300/60 dark:border-amber-700/50 flex flex-col sm:flex-row items-center justify-between text-xs gap-2"
          >
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Please sign in or use the 1-Click Demo to securely access your personalized expense tracker.</span>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shrink-0 hover:scale-105 transition-transform"
            >
              Sign In / Register
            </button>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* TOP HERO SECTION: Balance, Stats Trio & Monthly Limit     */}
        {/* ========================================================= */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center pt-2 sm:pt-4 pb-8"
        >
          {/* 3D Liquid Balance Ring */}
          <BalanceRing
            balance={summary.balance}
            income={summary.totalIncome}
            spent={summary.totalSpent}
            budgetLimit={budgetLimit}
            hasTransactions={transactions.length > 0}
            transactions={transactions}
            currentMonth={currentMonth}
            summary={summary}
            user={user}
          />

          {/* Income, Spent, Saved Trio */}
          <SummaryCards
            income={summary.totalIncome}
            spent={summary.totalSpent}
            saved={summary.saved}
          />

          {/* Monthly Spending Limit with Wavy Progress */}
          <SpendingLimit
            limit={budgetLimit}
            spent={summary.totalSpent}
            onSaveLimit={handleSaveLimit}
          />

          {/* Scroll Down Prompt Button */}
          <motion.button
            onClick={scrollToDashboard}
            whileHover={{ y: 3 }}
            className="mt-6 flex flex-col items-center space-y-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100">
              Manage & Entries
            </span>
            <ChevronDown className="w-5 h-5 animate-bounce stroke-[2.5]" />
          </motion.button>
        </motion.section>

        {/* ========================================================= */}
        {/* BOTTOM SECTION: Transaction Add Dashboard & Entries List */}
        {/* ========================================================= */}
        <section id="action-dashboard" className="pt-6">
          {/* 3D Glass Form Card with Scroll Reveal */}
          <TransactionForm
            onAddTransaction={handleAddTransaction}
            currentMonth={currentMonth}
          />

          {/* Entries Section with Scroll Stagger */}
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={(item) => setEditingItem(item)}
          />
        </section>

      </main>

      {/* Edit Modal */}
      <EditModal
        transaction={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />

      {/* Insights Intelligence Modal */}
      <InsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        currentMonth={currentMonth}
        summary={summary}
        budgetLimit={budgetLimit}
      />

      {/* Authentication Modal (Login / Register / 1-Click Demo) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile & Account Stats Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        token={token}
        onLogout={handleLogout}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
          localStorage.setItem('expense_tracker_user', JSON.stringify(updatedUser));
        }}
      />
    </div>
  );
}
