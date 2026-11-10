const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const fallback = require('../data/fallbackStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const AUTHORIZED_ADMIN_EMAIL = 'shaheeiipv@gmail.com';

/**
 * adminProtect — Verifies JWT and checks role === 'admin' and authorized email.
 * Used on all /api/admin/* routes (except /api/admin/login).
 */
exports.adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'monthly_expense_tracker_secret_jwt_key_2026_super_secure'
    );

    let user;

    if (isDbConnected()) {
      user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Admin user not found.' });
      }
    } else {
      const data = fallback.loadData();
      const found = (data.users || []).find((u) => u._id === decoded.id);
      if (!found) {
        return res.status(401).json({ success: false, message: 'Admin user not found.' });
      }
      const { password, ...rest } = found;
      user = rest;
    }

    if (user.role !== 'admin' || user.email !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token.'
    });
  }
};
