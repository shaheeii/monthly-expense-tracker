const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const fallback = require('../data/fallbackStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.protect = async (req, res, next) => {
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
      message: 'Access denied. Please log in to continue.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'monthly_expense_tracker_secret_jwt_key_2026_super_secure'
    );

    if (isDbConnected()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.'
        });
      }
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked. Please contact support.'
        });
      }
      req.user = user;
    } else {
      const data = fallback.loadData();
      const user = (data.users || []).find((u) => u._id === decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User session expired. Please log in again.'
        });
      }
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked. Please contact support.'
        });
      }
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
    }

    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};
