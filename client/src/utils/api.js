// Base API URL configuration
// In development: defaults to '/api' (proxied by Vite to localhost:5050)
// In production on Vercel: set VITE_API_URL to your Render backend URL (e.g. https://your-backend.onrender.com)
const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';

export const API_BASE = rawBase
  ? `${rawBase.replace(/\/+$/, '')}${rawBase.endsWith('/api') ? '' : '/api'}`
  : '/api';
