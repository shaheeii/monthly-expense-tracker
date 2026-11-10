import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed.');
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@example.com', password: 'demo1234' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Demo login failed.');
      }
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white/95 dark:bg-[#1A1D21]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 dark:border-white/10 text-left"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="text-center pb-5">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700/60">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access your personal monthly expense tracker'
                : 'Join to start tracking your finances and monthly spending'}
            </p>
          </div>

          {/* Segmented Switcher (Sign In vs Register) */}
          <div className="relative flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5">
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              className="absolute top-1 bottom-1 rounded-xl bg-white dark:bg-zinc-700 shadow-sm"
              style={{
                left: mode === 'login' ? '4px' : '50%',
                width: 'calc(50% - 4px)'
              }}
            />

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`relative z-10 w-1/2 py-2 text-xs font-bold rounded-xl transition-colors ${
                mode === 'login'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`relative z-10 w-1/2 py-2 text-xs font-bold rounded-xl transition-colors ${
                mode === 'register'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Shaheem"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shaheem@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all btn-3d-push disabled:opacity-50 text-sm shadow-md"
              >
                {isLoading ? (
                  <span className="inline-block animate-pulse">Processing...</span>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Free Account'
                )}
              </button>
            </div>
          </form>

          {/* 1-Click Demo Login Shortcut */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors py-1 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>Instant 1-Click Demo Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
