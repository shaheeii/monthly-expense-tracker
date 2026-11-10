import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminLogin from './admin/AdminLogin.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import './index.css';

function normalizePath(p) {
  if (!p) return '/';
  const clean = p.replace(/\/+$/, '').toLowerCase();
  return clean || '/';
}

function hasValidAdminAuth() {
  const token = localStorage.getItem('admin_token');
  const adminInfo = localStorage.getItem('admin_info');
  if (!token || !adminInfo) return false;
  try {
    const parsed = JSON.parse(adminInfo);
    return parsed.role === 'admin' && parsed.email === 'shaheeiipv@gmail.com';
  } catch {
    return false;
  }
}

function Root() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict Admin route guard:
  // 1. If requesting login page:
  if (currentPath === '/admin/login') {
    if (hasValidAdminAuth()) {
      return <AdminDashboard />;
    }
    return <AdminLogin />;
  }

  // 2. If requesting admin dashboard without credentials:
  // Block access immediately and show Admin Login
  if (currentPath === '/admin' || currentPath === '/admin/dashboard') {
    if (!hasValidAdminAuth()) {
      return <AdminLogin />;
    }
    return <AdminDashboard />;
  }

  // 3. Default application for regular users (users never see admin navigation or controls)
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
