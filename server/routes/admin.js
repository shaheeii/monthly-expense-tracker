const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
  adminLogin,
  getAllUsers,
  blockUser,
  unblockUser,
  getStats
} = require('../controllers/adminController');

// Public admin route
router.post('/login', adminLogin);

// Protected admin routes (require admin JWT)
router.get('/users', adminProtect, getAllUsers);
router.get('/stats', adminProtect, getStats);
router.put('/users/:id/block', adminProtect, blockUser);
router.put('/users/:id/unblock', adminProtect, unblockUser);

module.exports = router;

