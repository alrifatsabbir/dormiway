/* ============================================================
   app.js — Express application setup
   Dormiway Hotel Backend
   ============================================================ */
'use strict';

const express = require('express');
const cors    = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = express();

/* ── CORS ── */
const rawOrigins = (process.env.ALLOWED_ORIGIN || '*').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || rawOrigins.includes('*') || rawOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/* ── Body parsers ── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Security headers ── */
app.use(function (req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

/* ── Routes ── */
app.use('/api/admin', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/rooms', require('./routes/rooms.routes'));
app.use('/api/bookings', require('./routes/bookings.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

/* ── Health check ── */
app.get('/health', function (req, res) {
  res.json({ status: 'ok', service: 'dormiway-backend', time: new Date().toISOString() });
});

/* ── 404 handler ── */
app.use(function (req, res) {
  res.status(404).json({ message: 'Route not found.' });
});

/* ── Global error handler ── */
app.use(function (err, req, res, next) {
  console.error('[App] Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error.' });
});

module.exports = app;
