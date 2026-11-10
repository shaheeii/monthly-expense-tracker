const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile
} = require('../controllers/authController');

const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} = require('../controllers/transactionController');

const {
  getBudget,
  setBudget
} = require('../controllers/budgetController');

const { protect } = require('../middleware/auth');

// Auth Routes (Public)
router.post('/auth/register', register);
router.post('/auth/login', login);

// Auth Routes (Protected)
router.get('/auth/profile', protect, getProfile);
router.put('/auth/profile', protect, updateProfile);

// Transaction Routes (Protected)
router.get('/transactions', protect, getTransactions);
router.post('/transactions', protect, addTransaction);
router.put('/transactions/:id', protect, updateTransaction);
router.delete('/transactions/:id', protect, deleteTransaction);
router.get('/transactions/summary', protect, getSummary);

// Budget Routes (Protected)
router.get('/budget', protect, getBudget);
router.post('/budget', protect, setBudget);

module.exports = router;
