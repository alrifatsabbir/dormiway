/* ============================================================
   jwt.js — Sign and verify JSON Web Tokens
   ============================================================ */
'use strict';

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const SECRET           = process.env.JWT_SECRET;
const DEFAULT_EXPIRES  = process.env.JWT_EXPIRES_IN         || '8h';
const REMEMBER_EXPIRES = process.env.JWT_REMEMBER_EXPIRES_IN || '30d';

if (!SECRET || SECRET.length < 32) {
  console.warn('[JWT] WARNING: JWT_SECRET is missing or too short. Set a strong secret in .env');
}

/**
 * Sign a JWT with admin payload.
 * @param {object} payload   — { id, email, role }
 * @param {boolean} remember — true = 30 days, false = 8 hours
 */
function signToken(payload, remember = false) {
  return jwt.sign(payload, SECRET, {
    expiresIn: remember ? REMEMBER_EXPIRES : DEFAULT_EXPIRES,
    issuer:    'dormiway-admin',
    audience:  'dormiway-admin-panel',
  });
}

/**
 * Verify and decode a JWT.
 * Throws jwt.JsonWebTokenError / jwt.TokenExpiredError on failure.
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET, {
    issuer:   'dormiway-admin',
    audience: 'dormiway-admin-panel',
  });
}

module.exports = { signToken, verifyToken };
