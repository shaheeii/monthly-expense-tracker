const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const fallback = require('../data/fallbackStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const AUTHORIZED_ADMIN_EMAIL = 'shaheeiipv@gmail.com';
const MASTER_ADMIN_PASSWORD = 'Admin@Secure2026!';

const signAdminToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET || 'monthly_expense_tracker_secret_jwt_key_2026_super_secure',
    { expiresIn: '8h' }
  );

// POST /api/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();

    // Strict access: Only the specified admin email is allowed admin authentication
    if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Access denied. Unauthorized admin credentials.' });
    }

    let user;
    let isMatch = false;

    // Check if password matches the designated master admin password
    const isMasterMatch = cleanPassword === MASTER_ADMIN_PASSWORD;

    if (isDbConnected()) {
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        if (isMasterMatch) {
          isMatch = true;
          // Ensure role is admin in DB
          if (user.role !== 'admin' || user.isBlocked) {
            user.role = 'admin';
            user.isBlocked = false;
            await user.save();
          }
        } else {
          isMatch = await bcrypt.compare(cleanPassword, user.password);
        }
      } else if (isMasterMatch) {
        // Auto-create admin user in MongoDB if not present
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(MASTER_ADMIN_PASSWORD, salt);
        user = await User.create({
          name: 'Shaheem (Admin)',
          email: AUTHORIZED_ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
          isBlocked: false
        });
        isMatch = true;
      }
    } else {
      const data = fallback.loadData();
      user = (data.users || []).find((u) => u.email === normalizedEmail);

      if (user) {
        if (isMasterMatch) {
          isMatch = true;
          if (user.role !== 'admin' || user.isBlocked) {
            user.role = 'admin';
            user.isBlocked = false;
            fallback.saveData(data);
          }
        } else {
          isMatch = await bcrypt.compare(cleanPassword, user.password);
        }
      } else if (isMasterMatch) {
        // Auto-create admin user in fallback store if not present
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(MASTER_ADMIN_PASSWORD, salt);
        user = {
          _id: '75ae718f-bf57-4314-8778-9ee742378e55',
          name: 'Shaheem (Admin)',
          email: AUTHORIZED_ADMIN_EMAIL,
          password: hashedPassword,
          avatar: '',
          role: 'admin',
          isBlocked: false,
          createdAt: new Date().toISOString()
        };
        data.users.push(user);
        fallback.saveData(data);
        isMatch = true;
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Account is not an admin.' });
    }

    const token = signAdminToken(user._id || user.id);

    return res.json({
      success: true,
      token,
      admin: {
        _id: user._id || user.id,
        name: user.name || 'Admin',
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    let users;

    if (isDbConnected()) {
      users = await User.find({}).select('-password').lean();
      const Transaction = require('../models/Transaction');
      for (const u of users) {
        u.transactionCount = await Transaction.countDocuments({ user: u._id });
      }
    } else {
      const data = fallback.loadData();
      users = (data.users || []).map((u) => {
        const { password, ...rest } = u;
        const txCount = (data.transactions || []).filter((t) => t.user === String(u._id)).length;
        return { ...rest, transactionCount: txCount };
      });
    }

    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users.' });
  }
};

// PUT /api/admin/users/:id/block
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const adminId = String(req.user._id || req.user.id);

    if (targetId === adminId) {
      return res.status(400).json({ success: false, message: 'You cannot block your own admin account.' });
    }

    if (isDbConnected()) {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      if (user.role === 'admin' || user.email === AUTHORIZED_ADMIN_EMAIL) {
        return res.status(400).json({ success: false, message: 'Cannot block an admin account.' });
      }
      user.isBlocked = true;
      await user.save();
      return res.json({ success: true, message: `User "${user.name}" has been blocked.` });
    } else {
      const data = fallback.loadData();
      const idx = data.users.findIndex((u) => u._id === targetId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });
      if (data.users[idx].role === 'admin' || data.users[idx].email === AUTHORIZED_ADMIN_EMAIL) {
        return res.status(400).json({ success: false, message: 'Cannot block an admin account.' });
      }
      data.users[idx].isBlocked = true;
      fallback.saveData(data);
      return res.json({ success: true, message: `User "${data.users[idx].name}" has been blocked.` });
    }
  } catch (error) {
    console.error('Admin blockUser error:', error);
    res.status(500).json({ success: false, message: 'Server error blocking user.' });
  }
};

// PUT /api/admin/users/:id/unblock
exports.unblockUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (isDbConnected()) {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.isBlocked = false;
      await user.save();
      return res.json({ success: true, message: `User "${user.name}" has been unblocked.` });
    } else {
      const data = fallback.loadData();
      const idx = data.users.findIndex((u) => u._id === targetId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });
      data.users[idx].isBlocked = false;
      fallback.saveData(data);
      return res.json({ success: true, message: `User "${data.users[idx].name}" has been unblocked.` });
    }
  } catch (error) {
    console.error('Admin unblockUser error:', error);
    res.status(500).json({ success: false, message: 'Server error unblocking user.' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    let totalUsers = 0;
    let totalTransactions = 0;

    if (isDbConnected()) {
      const User = require('../models/User');
      const Transaction = require('../models/Transaction');
      totalUsers = await User.countDocuments({});
      totalTransactions = await Transaction.countDocuments({});
    } else {
      const data = fallback.loadData();
      totalUsers = (data.users || []).length;
      totalTransactions = (data.transactions || []).length;
    }

    return res.json({ success: true, data: { totalUsers, totalTransactions } });
  } catch (error) {
    console.error('Admin getStats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
};
