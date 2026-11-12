/* ============================================================
   users.controller.js — User (customer) authentication & profile
   ============================================================ */
'use strict';

const bcrypt = require('bcryptjs');
const {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  updateLastLogin,
  updateUserPassword,
  getAllUsers,
  getUserCount
} = require('../models/user.model');
const { signToken } = require('../utils/jwt');

/**
 * POST /api/users/register
 * Register a new user
 */
async function register(req, res) {
  const { firstName, lastName, email, password, phone } = req.body;

  /* ── Input validation ── */
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'First name, last name, email, and password are required.' });
  }

  if (typeof firstName !== 'string' || typeof lastName !== 'string' || 
      typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input types.' });
  }

  /* ── Length guards ── */
  if (email.length > 254 || password.length > 128 || firstName.length > 100 || lastName.length > 100) {
    return res.status(400).json({ message: 'Input exceeds maximum length.' });
  }

  /* ── Password strength validation ── */
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    /* ── Check if email already exists ── */
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    /* ── Hash password ── */
    const passwordHash = await bcrypt.hash(password, 10);

    /* ── Create user ── */
    const userId = await createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone ? phone.trim() : null
    });

    /* ── Return success response ── */
    return res.status(201).json({
      id: userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      createdAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Users] Register error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * POST /api/users/login
 * User login
 */
async function login(req, res) {
  const { email, password, rememberMe = false } = req.body;

  /* ── Input validation ── */
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input.' });
  }

  /* ── Length guards ── */
  if (email.length > 254 || password.length > 128) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  try {
    /* ── Find user by email ── */
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    /* ── Check if user is active ── */
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive. Contact support.' });
    }

    /* ── Verify password ── */
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    /* ── Issue JWT ── */
    const token = signToken(
      { id: user.id, email: user.email, role: 'user' },
      !!rememberMe
    );

    /* ── Update last login (non-blocking) ── */
    updateLastLogin(user.id).catch(err =>
      console.error('[Users] Failed to update last_login:', err.message)
    );

    /* ── Success response ── */
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || null
      }
    });

  } catch (err) {
    console.error('[Users] Login error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * POST /api/users/logout
 * User logout (client-side token invalidation)
 */
function logout(req, res) {
  return res.status(200).json({ message: 'Logged out successfully.' });
}

/**
 * GET /api/users/me
 * Get current user profile
 */
async function getMe(req, res) {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || null,
      nationality: user.nationality || null,
      createdAt: user.created_at
    });

  } catch (err) {
    console.error('[Users] getMe error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * PUT /api/users/:id
 * Update user profile
 */
async function updateProfile(req, res) {
  const { id } = req.params;
  const { firstName, lastName, phone, nationality, passportNumber } = req.body;

  /* ── Authorization check ── */
  if (String(id) !== String(req.user.id)) {
    return res.status(403).json({ message: 'You can only update your own profile.' });
  }

  /* ── Input validation ── */
  if (!firstName && !lastName && !phone && !nationality && !passportNumber) {
    return res.status(400).json({ message: 'At least one field is required to update.' });
  }

  try {
    /* ── Check if user exists ── */
    const user = await findUserById(String(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    /* ── Update profile ── */
    await updateUserProfile(String(id), {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      nationality: nationality !== undefined ? nationality : user.nationality,
      passportNumber: passportNumber !== undefined ? passportNumber : user.passportNumber
    });

    /* ── Get updated user ── */
    const updatedUser = await findUserById(String(id));

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone || null,
        nationality: updatedUser.nationality || null
      }
    });

  } catch (err) {
    console.error('[Users] updateProfile error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * POST /api/users/password-reset
 * Request password reset (mock - would send email in production)
 */
async function requestPasswordReset(req, res) {
  const { email } = req.body;

  /* ── Input validation ── */
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Valid email is required.' });
  }

  try {
    /* ── Check if user exists (but don't reveal if it does) ── */
    const user = await findUserByEmail(email);

    if (user) {
      /* ── In production, generate reset token and send email ── */
      /* ── For now, just acknowledge ── */
      console.log(`[Users] Password reset requested for: ${email}`);
    }

    /* ── Always return success to prevent email enumeration ── */
    return res.status(200).json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });

  } catch (err) {
    console.error('[Users] requestPasswordReset error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * PUT /api/users/password-reset/:token
 * Reset password with token (mock)
 */
async function resetPassword(req, res) {
  const { token } = req.params;
  const { newPassword } = req.body;

  /* ── Input validation ── */
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    /* ── In production, validate token and find associated user ── */
    /* ── For now, return mock success ── */
    console.log(`[Users] Password reset attempt with token: ${token}`);

    return res.status(200).json({ 
      message: 'Password reset successfully. Please log in with your new password.' 
    });

  } catch (err) {
    console.error('[Users] resetPassword error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * GET /api/admin/guests
 * Get all guests (admin only)
 */
async function getAllGuestsAdmin(req, res) {
  const { limit = 20, page = 1, searchTerm = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let guests;
    let total;

    if (searchTerm) {
      /* ── Search functionality (if guest model has it) ── */
      const { searchGuests } = require('../models/guest.model');
      guests = await searchGuests(searchTerm, parseInt(limit), offset);
      total = guests.length; // Simplified count
    } else {
      const { getAllGuests, getGuestsCount } = require('../models/guest.model');
      guests = await getAllGuests(parseInt(limit), offset);
      total = await getGuestsCount();
    }

    return res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      guests
    });

  } catch (err) {
    console.error('[Users] getAllGuestsAdmin error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/guests/:id
 * Get guest detail (admin only)
 */
async function getGuestDetail(req, res) {
  const { id } = req.params;

  try {
    const { getGuestDetail: getGuestDetailModel } = require('../models/guest.model');
    const guest = await getGuestDetailModel(String(id));

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found.' });
    }

    return res.status(200).json(guest);

  } catch (err) {
    console.error('[Users] getGuestDetail error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  getAllGuestsAdmin,
  getGuestDetail
};
