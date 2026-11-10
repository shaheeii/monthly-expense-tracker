const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String, // Format 'YYYY-MM', e.g., '2026-10'
    required: true
  },
  limit: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// A user can only have one budget setting per month
budgetSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
