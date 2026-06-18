require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const riskZoneRoutes = require('./routes/riskZones');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── General middleware ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Database ──────────────────────────────────────────────────────
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drivemind';

// ── Routes ───────────────────────────────────────────────────────
console.log('📍 Registering routes...');
console.log('Auth routes:', authRoutes.stack.length, 'handlers');
console.log('Trip routes:', tripRoutes.stack.length, 'handlers');
console.log('RiskZone routes:', riskZoneRoutes.stack.length, 'handlers');
console.log('Analytics routes:', analyticsRoutes.stack.length, 'handlers');

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/risk-zones', riskZoneRoutes);
app.use('/api/analytics', analyticsRoutes);

console.log('✅ Routes registered');

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'DriveMind AI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ── Start server ──────────────────────────────────────────────────
async function startServer() {
  try {
    await mongoose.connect(DB_URI);
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚗 DriveMind AI server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
