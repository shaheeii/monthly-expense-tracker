import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null, action: '' });
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Verification on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminInfo = localStorage.getItem('admin_info');

    if (!token || !adminInfo) {
      window.location.href = '/admin/login';
      return;
    }

    try {
      const parsed = JSON.parse(adminInfo);
      if (parsed.role !== 'admin' || parsed.email !== 'shaheeiipv@gmail.com') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        window.location.href = '/admin/login';
        return;
      }
      setAdmin(parsed);
      loadDashboardData(token);
    } catch {
      window.location.href = '/admin/login';
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const loadDashboardData = async (token) => {
    setLoading(true);
    const authToken = token || localStorage.getItem('admin_token');

    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (usersRes.status === 401 || usersRes.status === 403) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        window.location.href = '/admin/login';
        return;
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) {
        setUsers(usersData.data || []);
      }
      if (statsData.success && statsData.data) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showNotification('Failed to connect to server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    window.location.href = '/admin/login';
  };

  const triggerConfirm = (user, action) => {
    setConfirmModal({ open: true, user, action });
  };

  const executeStatusChange = async () => {
    const { user, action } = confirmModal;
    if (!user) return;

    setConfirmModal({ open: false, user: null, action: '' });
    setActionLoadingId(user._id);

    const token = localStorage.getItem('admin_token');
    const endpoint = `/api/admin/users/${user._id}/${action}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Immediate local state update
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isBlocked: action === 'block' } : u))
        );
        showNotification(data.message || `User successfully ${action}ed.`);
      } else {
        showNotification(data.message || `Failed to ${action} user.`, 'error');
      }
    } catch (err) {
      console.error('Error modifying user status:', err);
      showNotification('Network error occurred.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  // Block unauthorized rendering until credentials are fully verified
  if (!admin && loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying administrator access…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg text-slate-950 font-black text-sm">
              AD
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">Expense Tracker Admin</h1>
              <p className="text-xs text-slate-400">Security & User Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{admin?.name || 'Admin'}</span>
              <span className="text-[11px] text-amber-400">{admin?.email}</span>
            </div>

            <a
              href="/"
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-colors border border-amber-500/30 flex items-center space-x-1"
            >
              <span>Main App</span>
            </a>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Flash Notification */}
        {notification.message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
              notification.type === 'error'
                ? 'bg-rose-950/80 border-rose-800 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ message: '', type: '' })}
              className="text-xs opacity-70 hover:opacity-100 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Users</span>
            <div className="text-3xl font-extrabold text-white mt-2">{users.length || stats.totalUsers || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Across entire database</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Accounts</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              {users.filter((u) => !u.isBlocked).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Allowed API access</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocked Accounts</span>
            <div className="text-3xl font-extrabold text-rose-400 mt-2">
              {users.filter((u) => u.isBlocked).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Access revoked (403)</p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Registered Users Directory</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage permissions, roles, and account access</p>
            </div>

            <button
              onClick={() => loadDashboardData()}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Refreshing…' : '↻ Refresh Directory'}</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">Transactions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500 text-sm">
                      {loading ? 'Loading user records...' : 'No users registered yet.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u._id === admin?._id || u.email === admin?.email;
                    const isTargetAdmin = u.role === 'admin';

                    return (
                      <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                        {/* User Identity */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 uppercase">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-[11px]">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {u.role || 'user'}
                          </span>
                        </td>

                        {/* Registration Date */}
                        <td className="py-4 px-4 text-slate-400">{formatDate(u.createdAt)}</td>

                        {/* Transactions Count */}
                        <td className="py-4 px-4 font-medium text-slate-300">
                          {u.transactionCount !== undefined ? u.transactionCount : '—'}
                        </td>

                        {/* Account Status */}
                        <td className="py-4 px-4">
                          {u.isBlocked ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              ● Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ● Active
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-5 text-right">
                          {isSelf || isTargetAdmin ? (
                            <span className="text-slate-600 text-[11px] italic">Admin Account</span>
                          ) : u.isBlocked ? (
                            <button
                              onClick={() => triggerConfirm(u, 'unblock')}
                              disabled={actionLoadingId === u._id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold transition-all cursor-pointer disabled:opacity-50 text-[11px]"
                            >
                              {actionLoadingId === u._id ? 'Processing…' : 'Unblock Access'}
                            </button>
                          ) : (
                            <button
                              onClick={() => triggerConfirm(u, 'block')}
                              disabled={actionLoadingId === u._id}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold transition-all cursor-pointer disabled:opacity-50 text-[11px]"
                            >
                              {actionLoadingId === u._id ? 'Processing…' : 'Block User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              Confirm {confirmModal.action === 'block' ? 'Account Suspension' : 'Account Reinstatement'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to{' '}
              <strong className={confirmModal.action === 'block' ? 'text-rose-400' : 'text-emerald-400'}>
                {confirmModal.action}
              </strong>{' '}
              <strong>{confirmModal.user?.name}</strong> ({confirmModal.user?.email})?
              {confirmModal.action === 'block' &&
                ' The user will immediately be locked out and denied access to all transactions and tracker APIs.'}
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ open: false, user: null, action: '' })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeStatusChange}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg ${
                  confirmModal.action === 'block'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                }`}
              >
                Yes, {confirmModal.action === 'block' ? 'Block User' : 'Unblock User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

