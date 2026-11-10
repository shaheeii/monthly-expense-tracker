const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const fallback = require('../data/fallbackStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/budget?month=YYYY-MM
exports.getBudget = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month query param required (YYYY-MM).' });
    }

    if (isDbConnected()) {
      const budget = await Budget.findOne({ user: userId, month });
      return res.json({ success: true, data: { month, limit: budget ? budget.limit : 0 } });
    } else {
      const data = fallback.loadData();
      const key = `${userId}_${month}`;
      const limit = (data.budgets && data.budgets[key]) || 0;
      return res.json({ success: true, data: { month, limit }, source: 'local-store' });
    }
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ success: false, message: 'Server error fetching budget.' });
  }
};

// POST /api/budget
exports.setBudget = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month, limit } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required.' });
    }
    const cleanLimit = typeof limit === 'string' ? limit.replace(/,/g, '').trim() : limit;
    const numLimit = Math.max(0, Math.round((parseFloat(cleanLimit) || 0) * 100) / 100);

    if (isDbConnected()) {
      const budget = await Budget.findOneAndUpdate(
        { user: userId, month },
        { limit: numLimit, updatedAt: Date.now() },
        { upsert: true, new: true, runValidators: true }
      );
      return res.json({ success: true, data: budget });
    } else {
      const data = fallback.loadData();
      if (!data.budgets) data.budgets = {};
      const key = `${userId}_${month}`;
      data.budgets[key] = numLimit;
      fallback.saveData(data);
      return res.json({ success: true, data: { month, limit: numLimit }, source: 'local-store' });
    }
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({ success: false, message: 'Server error saving budget.' });
  }
};
