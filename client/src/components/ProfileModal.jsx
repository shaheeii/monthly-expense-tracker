import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, User, Calendar, CreditCard, ShieldCheck, Check, ArrowUpRight, ArrowDownLeft, PiggyBank } from 'lucide-react';
import { formatRupee } from '../utils/formatters';

export default function ProfileModal({ isOpen, onClose, user, token, onLogout, onProfileUpdated }) {
  if (!isOpen || !user) return null;

  const [stats, setStats] = useState({
    totalTransactions: 0,
    allTimeSpent: 0,
    allTimeIncome: 0,
    allTimeSavings: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Fetch full profile & stats from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data?.stats) {
          setStats(data.data.stats);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          ...(editPassword && { password: editPassword })
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Profile updated successfully!');
        onProfileUpdated(data.user);
        setIsEditing(false);
        setEditPassword('');
      } else {
        setStatusMsg(data.message || 'Update failed.');
      }
    } catch (err) {
      setStatusMsg('Error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    : 'Recent';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          className="relative w-full max-w-md bg-white/95 dark:bg-[#1A1D21]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 dark:border-white/10 text-left max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              User Profile
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Info Avatar Card */}
          <div className="flex items-center space-x-4 py-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-lg font-black shadow-md shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
              <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400 mt-1">
                <Calendar className="w-3 h-3" />
                <span>Member since {joinDate}</span>
              </span>
            </div>
          </div>

          {/* Account Lifetime Financial Stats */}
          <div className="grid grid-cols-2 gap-2.5 py-2">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transactions</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {stats.totalTransactions} logged
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-rose-500 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>All-Time Spent</span>
              </div>
              <p className="text-base font-bold text-rose-500 mt-1">
                {formatRupee(stats.allTimeSpent)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-emerald-500 font-medium">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>All-Time Income</span>
              </div>
              <p className="text-base font-bold text-emerald-500 mt-1">
                {formatRupee(stats.allTimeIncome)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-zinc-500 font-medium">
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Net Savings</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {formatRupee(stats.allTimeSavings)}
              </p>
            </div>
          </div>

          {/* Edit Profile Section */}
          <div className="pt-3 pb-2">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    minLength={6}
                    className="w-full text-xs font-medium px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Edit Account Details</span>
              </button>
            )}

            {statusMsg && (
              <p className="text-xs text-center font-medium text-emerald-600 dark:text-emerald-400 mt-2">
                {statusMsg}
              </p>
            )}
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Tracker</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
