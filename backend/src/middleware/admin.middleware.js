/* ============================================================
   admin.middleware.js — Ensure role === 'admin'
   Must run AFTER auth.middleware.js (requires req.admin)
   ============================================================ */
'use strict';

function requireAdmin(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.admin.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
}

/**
 * Middleware to require user role (for protected user endpoints)
 */
function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'User access required.' });
  }

  next();
}

module.exports = { requireAdmin, requireUser };
