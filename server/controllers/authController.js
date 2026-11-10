const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fallback = require('../data/fallbackStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'monthly_expense_tracker_secret_jwt_key_2026_super_secure',
    { expiresIn: '30d' }
  );
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'user',
        isBlocked: false
      });

      const token = signToken(user._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } else {
      const data = fallback.loadData();
      const userExists = data.users.find((u) => u.email === normalizedEmail);
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: crypto.randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        avatar: '',
        role: 'user',
        isBlocked: false,
        createdAt: new Date().toISOString()
      };

      data.users.push(newUser);
      fallback.saveData(data);

      const token = signToken(newUser._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Check if account has been suspended/blocked
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended or blocked by an administrator.'
        });
      }

      const token = signToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          createdAt: user.createdAt
        }
      });
    } else {
      const data = fallback.loadData();
      const user = data.users.find((u) => u.email === normalizedEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Check if account has been suspended/blocked
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended or blocked by an administrator.'
        });
      }

      const token = signToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          createdAt: user.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    let txCount = 0;
    let allTimeSpent = 0;
    let allTimeIncome = 0;

    if (isDbConnected()) {
      const transactions = await Transaction.find({ user: userId });
      txCount = transactions.length;
      transactions.forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'expense') allTimeSpent += amt;
        else allTimeIncome += amt;
      });
    } else {
      const data = fallback.loadData();
      const userTxs = (data.transactions || []).filter((t) => t.user === String(userId));
      txCount = userTxs.length;
      userTxs.forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'expense') allTimeSpent += amt;
        else allTimeIncome += amt;
      });
    }

    allTimeSpent = Math.round(allTimeSpent * 100) / 100;
    allTimeIncome = Math.round(allTimeIncome * 100) / 100;

    return res.json({
      success: true,
      data: {
        user: req.user,
        stats: {
          totalTransactions: txCount,
          allTimeSpent,
          allTimeIncome,
          allTimeSavings: Math.max(0, Math.round((allTimeIncome - allTimeSpent) * 100) / 100)
        }
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, password } = req.body;

    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (name) user.name = name.trim();
      if (password && password.length >= 6) {
        user.password = password; // pre-save hook will hash it
      }

      await user.save();

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          createdAt: user.createdAt
        }
      });
    } else {
      const data = fallback.loadData();
      const index = data.users.findIndex((u) => u._id === String(userId));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (name) data.users[index].name = name.trim();
      if (password && password.length >= 6) {
        const salt = await bcrypt.genSalt(10);
        data.users[index].password = await bcrypt.hash(password, salt);
      }

      fallback.saveData(data);

      const { password: _, ...userClean } = data.users[index];

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: userClean
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};
