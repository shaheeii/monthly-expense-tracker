import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowRight, KeyRound, CheckCircle2, RotateCcw } from 'lucide-react';
import { API_BASE } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  // If a last-used email is saved (from a previous registration/login),
  // default straight to 'login' mode and pre-fill that email.
  const savedEmail = localStorage.getItem('expense_tracker_last_email') || '';

  // Modes: 'login', 'register', 'forgot', 'reset'
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & OTP verification states
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cooldown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const resetAllFields = () => {
    setError('');
    setSuccessMsg('');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle Standard Login & Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    const endpoint = mode === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
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

      // Remember this email so next time the modal opens it pre-fills Sign In
      if (email) {
        localStorage.setItem('expense_tracker_last_email', email.toLowerCase().trim());
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 of Forgot Password: Send OTP to Email
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to send verification code.');
      }

      setMode('reset');
      setResendCooldown(60);
      setSuccessMsg(data.message || 'Verification code sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 of Forgot Password: Verify OTP and Reset Password
  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Password reset failed.');
      }

      // Success! Switch back to login mode with success notice
      setMode('login');
      resetAllFields();
      setSuccessMsg('Password reset successfully! Please sign in with your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@example.com', password: 'demo1234' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Demo login failed.');
      }
      localStorage.setItem('expense_tracker_last_email', 'demo@example.com');
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isResetFlow = mode === 'forgot' || mode === 'reset';

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
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="text-center pb-5">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700/60">
              {isResetFlow ? <KeyRound className="w-6 h-6 text-amber-500" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'register'
                ? 'Create an Account'
                : mode === 'forgot'
                ? 'Reset Password'
                : 'Verify Code'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access your personal monthly expense tracker'
                : mode === 'register'
                ? 'Join to start tracking your finances and monthly spending'
                : mode === 'forgot'
                ? 'Enter your registered email to receive a 6-digit verification code'
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Sign In vs Register Tabs (hidden in forgot/reset mode) */}
          {!isResetFlow && (
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
                onClick={() => { setMode('login'); resetAllFields(); }}
                className={`relative z-10 w-1/2 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => { setMode('register'); resetAllFields(); setEmail(''); }}
                className={`relative z-10 w-1/2 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* ======================================================== */}
          {/* FLOW 1: Standard Login & Register Form                   */}
          {/* ======================================================== */}
          {!isResetFlow && (
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); resetAllFields(); }}
                      className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

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
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all btn-3d-push disabled:opacity-50 text-sm shadow-md cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-block animate-pulse">Processing...</span>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Free Account'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* FLOW 2: Step 1 - Request OTP Form                        */}
          {/* ======================================================== */}
          {mode === 'forgot' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Registered Email Address
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    autoFocus
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 transition-all btn-3d-push disabled:opacity-50 text-sm shadow-md cursor-pointer"
              >
                {isLoading ? 'Sending verification code...' : 'Send 6-Digit Code (OTP)'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetAllFields(); }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* FLOW 3: Step 2 - Verify OTP & Set New Password           */}
          {/* ======================================================== */}
          {mode === 'reset' && (
            <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    6-Digit Verification Code (OTP)
                  </label>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={() => handleRequestOtp()}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50 cursor-pointer flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-center text-lg font-mono font-extrabold tracking-widest rounded-xl py-2 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all btn-3d-push disabled:opacity-50 text-sm shadow-md cursor-pointer"
                >
                  {isLoading ? 'Updating password...' : 'Verify OTP & Reset Password'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetAllFields(); }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* 1-Click Demo Login Shortcut (only on login tab) */}
          {!isResetFlow && mode === 'login' && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors py-1 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <span>Instant 1-Click Demo Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
