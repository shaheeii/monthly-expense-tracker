const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { PORT, MONGODB_URI, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('./config');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// In-Memory Rate Limiting with memory safety
const rateLimitMap = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count += 1;
  }
  rateLimitMap.set(ip, record);

  // Prevent memory growth in long-running processes
  if (rateLimitMap.size > 2000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }

  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.'
    });
  }
  next();
});

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'fallback-store',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build in production/hosting
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Connect to MongoDB or fallback cleanly
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 2500
  })
  .then(async () => {
    console.log('Connected to MongoDB at', MONGODB_URI);
    // Ensure admin account exists with admin role in MongoDB
    try {
      const User = require('./models/User');
      const bcrypt = require('bcryptjs');
      const adminEmail = 'shaheeiipv@gmail.com';
      const existing = await User.findOne({ email: adminEmail });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@Secure2026!', salt);

      if (existing) {
        existing.role = 'admin';
        existing.isBlocked = false;
        existing.password = hashedPassword;
        await existing.save();
        console.log('Admin account (shaheeiipv@gmail.com) synced with admin role in MongoDB.');
      } else {
        await User.create({
          name: 'Shaheem (Admin)',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isBlocked: false
        });
        console.log('Admin account (shaheeiipv@gmail.com) created in MongoDB.');
      }
    } catch (e) {
      console.warn('Admin MongoDB sync notice:', e.message);
    }
  })
  .catch((err) => {
    console.warn('MongoDB connection not available (' + err.message + ').');
    console.warn('Using local JSON persistent store (server/data/store.json).');
  });

// Safe server boot with port auto-increment if port is occupied
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`Expense Tracker Server listening on http://localhost:${portToTry}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      const nextPort = Number(portToTry) + 1;
      console.warn(`Port ${portToTry} is not available (${err.code}), trying ${nextPort}`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });

  const shutdown = () => {
    console.log('\nShutting down server...');
    server.close(() => {
      console.log('Server stopped');
      if (mongoose.connection.readyState === 1) {
        mongoose.disconnect().then(() => process.exit(0));
      } else {
        process.exit(0);
      }
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer(PORT);
