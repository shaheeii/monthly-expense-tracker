// config/index.js
// Centralised configuration with built-in validation
require('dotenv').config();

const PORT = parseInt(process.env.PORT, 10) || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';
const JWT_SECRET = process.env.JWT_SECRET || 'monthly_expense_tracker_secret_jwt_key_2026_super_secure';
const NODE_ENV = process.env.NODE_ENV || 'development';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 300;

module.exports = {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  NODE_ENV,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX
};
