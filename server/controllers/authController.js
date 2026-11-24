const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fallback = require('../data/fallbackStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// In-memory secure OTP store: email -> { hashedOtp, expiresAt, attempts, requestedAt }
const otpStore = new Map();

// Helper to hash OTP securely before storing in memory
const hashOtp = (email, otp) => {
  return crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
};

// Periodically clean up expired OTP records
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (now > val.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Helper to create Nodemailer transport
const getTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // If custom SMTP host is provided
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: { user, pass }
    });
  }

  // Default to standard Gmail service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

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

// POST /api/auth/forgot-password - Generate and send OTP via Nodemailer
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email service is configured
    const transporter = getTransporter();
    if (!transporter) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in server/.env to send OTP emails.'
      });
    }

    // Rate-limit: Check if an OTP was recently requested within the last 60 seconds
    const existing = otpStore.get(normalizedEmail);
    if (existing && Date.now() - existing.requestedAt < 60 * 1000) {
      const remainingSec = Math.ceil((60 * 1000 - (Date.now() - existing.requestedAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSec} seconds before requesting a new code.`
      });
    }

    let userExists = false;
    let userName = 'Valued User';

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        if (user.isBlocked) {
          return res.status(403).json({ success: false, message: 'This account has been suspended or blocked.' });
        }
        userExists = true;
        userName = user.name || userName;
      }
    } else {
      const data = fallback.loadData();
      const user = (data.users || []).find((u) => u.email === normalizedEmail);
      if (user) {
        if (user.isBlocked) {
          return res.status(403).json({ success: false, message: 'This account has been suspended or blocked.' });
        }
        userExists = true;
        userName = user.name || userName;
      }
    }

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.'
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    const senderEmail = process.env.EMAIL_USER || process.env.SMTP_USER;
    const senderName = process.env.EMAIL_FROM || 'Monthly Expense Tracker';

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: normalizedEmail,
      subject: `${otp} is your Expense Tracker password reset code`,
      text: `Hello ${userName},\n\nYour 6-digit verification code to reset your password is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please secure your account immediately.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0f172a; padding: 28px 32px; text-align: center;">
                      <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Expense Tracker</h1>
                      <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Account Security</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 36px 32px; text-align: center;">
                      <p style="font-size: 16px; color: #1e293b; font-weight: 600; margin: 0 0 8px;">Hello, ${userName}</p>
                      <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 28px;">
                        We received a request to reset your password. Use the verification code below to complete your password reset:
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px 24px; margin-bottom: 28px; display: inline-block;">
                        <span style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0f172a; margin-right: -10px;">${otp}</span>
                      </div>
                      
                      <p style="font-size: 12px; color: #64748b; margin: 0 0 8px;">
                        ⏱️ This verification code is valid for <strong>10 minutes</strong>.
                      </p>
                      <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
                        If you did not request a password reset, please ignore this email or update your password if you suspect unauthorized access.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
                      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                        This is an automated security message from Monthly Expense Tracker.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    // Attempt to send email through Nodemailer
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Password reset OTP delivered to: ${normalizedEmail}`);
    } catch (mailErr) {
      console.error('[Email Service] Failed to send email via SMTP:', mailErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to deliver verification email. Please verify your email credentials in server/.env.'
      });
    }

    // Save hashed OTP ONLY after email sending succeeds
    otpStore.set(normalizedEmail, {
      hashedOtp: hashOtp(normalizedEmail, otp),
      expiresAt,
      attempts: 0,
      requestedAt: Date.now()
    });

    // Return success WITHOUT exposing the OTP in the HTTP response
    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${normalizedEmail}. Please check your inbox and spam folder.`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error processing password reset.' });
  }
};

// POST /api/auth/reset-password - Verify OTP securely and update password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, 6-digit OTP, and your new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found or it has expired. Please request a new code.'
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (record.attempts >= 5) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }

    // Compare cryptographic hashes
    const inputHash = hashOtp(normalizedEmail, cleanOtp);
    if (record.hashedOtp !== inputHash) {
      record.attempts += 1;
      const attemptsLeft = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining.` : 'Please request a new code.'}`
      });
    }

    // OTP is valid! Hash new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }
      user.password = hashedPassword;
      await user.save();
    } else {
      const data = fallback.loadData();
      const userIdx = (data.users || []).findIndex((u) => u.email === normalizedEmail);
      if (userIdx === -1) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }
      data.users[userIdx].password = hashedPassword;
      fallback.saveData(data);
    }

    // Invalidate OTP immediately upon successful reset (single-use)
    otpStore.delete(normalizedEmail);

    return res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
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
