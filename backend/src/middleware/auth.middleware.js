/* ============================================================
   auth.middleware.js — Verify JWT on protected routes
   ============================================================ */
'use strict';

const { verifyToken } = require('../utils/jwt');

/**
 * Attaches decoded payload to req.admin (for admin) or req.user (for users).
 * Returns 401 if token is missing or invalid.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = verifyToken(token);
    /* { id, email, role, iat, exp } */
    
    /* Attach to appropriate object based on role */
    if (decoded.role === 'admin') {
      req.admin = decoded;
    } else if (decoded.role === 'user') {
      req.user = decoded;
    } else {
      return res.status(401).json({ message: 'Invalid token role.' });
    }
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please sign in again.' });
  }
}

module.exports = { requireAuth };
