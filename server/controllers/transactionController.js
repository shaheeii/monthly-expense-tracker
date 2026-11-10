const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const fallback = require('../data/fallbackStore');
const crypto = require('crypto');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Parse amount safely (strips commas, enforces positive number, rounds to 2 decimals)
function parseSafeAmount(val) {
  if (val === undefined || val === null) return NaN;
  const clean = typeof val === 'string' ? val.replace(/,/g, '').trim() : String(val);
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return NaN;
  return Math.round(num * 100) / 100;
}

// Ensure date is in standard YYYY-MM-DD format
function normalizeDate(d) {
  if (!d) return '';
  const str = String(d).trim();
  // If full ISO string or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return str;
}

// GET /api/transactions?month=YYYY-MM
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month } = req.query;

    if (isDbConnected()) {
      let query = { user: userId };
      if (month) {
        query.date = { $regex: `^${month}` };
      }
      const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
      return res.json({ success: true, count: transactions.length, data: transactions });
    } else {
      const data = fallback.loadData();
      let list = (data.transactions || []).filter((t) => t.user === String(userId));
      if (month) {
        list = list.filter((t) => t.date && t.date.startsWith(month));
      }
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json({ success: true, count: list.length, data: list, source: 'local-store' });
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server error fetching transactions.' });
  }
};

// POST /api/transactions
exports.addTransaction = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { type, amount, category, date, note } = req.body;

    const numAmount = parseSafeAmount(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a valid positive number.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }
    const cleanDate = normalizeDate(date);
    if (!cleanDate) {
      return res.status(400).json({ success: false, message: 'Valid date is required (YYYY-MM-DD).' });
    }

    const newTx = {
      user: userId,
      type: type === 'income' ? 'income' : 'expense',
      amount: numAmount,
      category: category.trim(),
      date: cleanDate,
      note: note ? String(note).trim() : ''
    };

    if (isDbConnected()) {
      const created = await Transaction.create(newTx);
      return res.status(201).json({ success: true, data: created });
    } else {
      const data = fallback.loadData();
      const created = {
        _id: crypto.randomUUID(),
        ...newTx,
        user: String(userId),
        createdAt: new Date().toISOString()
      };
      if (!data.transactions) data.transactions = [];
      data.transactions.unshift(created);
      fallback.saveData(data);
      return res.status(201).json({ success: true, data: created, source: 'local-store' });
    }
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ success: false, message: 'Server error adding transaction.' });
  }
};

// PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { type, amount, category, date, note } = req.body;

    const updateFields = {};
    if (type !== undefined) updateFields.type = type === 'income' ? 'income' : 'expense';
    if (amount !== undefined) {
      const numAmount = parseSafeAmount(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a valid positive number.' });
      }
      updateFields.amount = numAmount;
    }
    if (category !== undefined) {
      if (!category.trim()) return res.status(400).json({ success: false, message: 'Category cannot be empty.' });
      updateFields.category = category.trim();
    }
    if (date !== undefined) {
      const cleanDate = normalizeDate(date);
      if (!cleanDate) return res.status(400).json({ success: false, message: 'Valid date is required.' });
      updateFields.date = cleanDate;
    }
    if (note !== undefined) updateFields.note = String(note).trim();

    if (isDbConnected()) {
      const updated = await Transaction.findOneAndUpdate(
        { _id: id, user: userId },
        updateFields,
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
      }
      return res.json({ success: true, data: updated });
    } else {
      const data = fallback.loadData();
      const index = data.transactions.findIndex(
        (t) => t._id === id && t.user === String(userId)
      );
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
      }
      data.transactions[index] = {
        ...data.transactions[index],
        ...updateFields
      };
      fallback.saveData(data);
      return res.json({ success: true, data: data.transactions[index] });
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, message: 'Server error updating transaction.' });
  }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await Transaction.findOneAndDelete({ _id: id, user: userId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
      }
      return res.json({ success: true, message: 'Transaction deleted successfully.' });
    } else {
      const data = fallback.loadData();
      const initialLen = data.transactions.length;
      data.transactions = data.transactions.filter(
        (t) => !(t._id === id && t.user === String(userId))
      );
      if (data.transactions.length === initialLen) {
        return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
      }
      fallback.saveData(data);
      return res.json({ success: true, message: 'Transaction deleted successfully.' });
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: 'Server error deleting transaction.' });
  }
};

// GET /api/transactions/summary?month=YYYY-MM
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month } = req.query;

    let transactions = [];
    if (isDbConnected()) {
      let query = { user: userId };
      if (month) {
        query.date = { $regex: `^${month}` };
      }
      transactions = await Transaction.find(query);
    } else {
      const data = fallback.loadData();
      transactions = (data.transactions || []).filter((t) => t.user === String(userId));
      if (month) {
        transactions = transactions.filter((t) => t.date && t.date.startsWith(month));
      }
    }

    let totalIncome = 0;
    let totalSpent = 0;
    const categoryBreakdown = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalSpent += amt;
        const cat = t.category || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      }
    });

    // Precise rounding to 2 decimal places to prevent floating-point drift
    totalIncome = Math.round(totalIncome * 100) / 100;
    totalSpent = Math.round(totalSpent * 100) / 100;
    const balance = Math.round((totalIncome - totalSpent) * 100) / 100;
    const saved = Math.max(0, balance);
    const savingsRate = totalIncome > 0 ? Math.round((saved / totalIncome) * 100) : 0;

    Object.keys(categoryBreakdown).forEach((k) => {
      categoryBreakdown[k] = Math.round(categoryBreakdown[k] * 100) / 100;
    });

    let dailyAverage = 0;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const now = new Date();
      let daysCount = new Date(year, m, 0).getDate();
      if (now.getFullYear() === year && now.getMonth() + 1 === m) {
        daysCount = Math.max(1, now.getDate());
      }
      dailyAverage = totalSpent / daysCount;
    }

    return res.json({
      success: true,
      data: {
        totalIncome,
        totalSpent,
        balance,
        saved,
        savingsRate,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        transactionCount: transactions.length,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ success: false, message: 'Server error calculating summary.' });
  }
};
