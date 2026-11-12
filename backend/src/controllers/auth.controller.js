/* ============================================================
   auth.controller.js — Admin authentication handlers
   ============================================================ */
'use strict';

const bcrypt = require('bcryptjs');
const { findAdminByEmail, updateLastLogin } = require('../models/admin.model');
const { signToken } = require('../utils/jwt');

/**
 * POST /api/admin/login
 * Body: { email, password, rememberMe? }
 */
async function login(req, res) {
  const { email, password, rememberMe = false } = req.body;

  /* ── Input presence check ── */
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input.' });
  }

  /* ── Length guards (prevent excessive DB/bcrypt work) ── */
  if (email.length > 254 || password.length > 128) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  try {
    /* ── Find admin by email ── */
    const admin = await findAdminByEmail(email);

    if (!admin) {
      /* Use a generic message — do NOT reveal whether email exists */
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    /* ── Role check — only 'admin' role is allowed ── */
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin accounts only.' });
    }

    /* ── bcrypt verification ── */
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    /* ── Issue JWT ── */
    const token = signToken(
      { id: admin.id, email: admin.email, role: admin.role },
      !!rememberMe
    );

    /* ── Update last login (non-blocking) ── */
    updateLastLogin(admin.id).catch(err =>
      console.error('[Auth] Failed to update last_login:', err.message)
    );

    /* ── Success response ── */
    return res.status(200).json({
      token,
      admin: {
        id:    admin.id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
    });

  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * POST /api/admin/logout
 * (Token invalidation is client-side — server just acknowledges)
 */
function logout(req, res) {
  return res.status(200).json({ message: 'Logged out successfully.' });
}

/**
 * GET /api/admin/me
 * Returns the authenticated admin's profile (requires auth middleware).
 */
async function getMe(req, res) {
  try {
    const admin = await findAdminByEmail(req.admin.email);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    return res.status(200).json({
      id:    admin.id,
      name:  admin.name,
      email: admin.email,
      role:  admin.role,
    });
  } catch (err) {
    console.error('[Auth] getMe error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = { login, logout, getMe };
