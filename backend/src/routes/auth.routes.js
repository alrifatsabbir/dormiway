/* ============================================================
   auth.routes.js — Admin authentication routes
   ============================================================ */
'use strict';

const express = require('express');
const router  = express.Router();

const { login, logout, getMe } = require('../controllers/auth.controller');
const { requireAuth }          = require('../middleware/auth.middleware');
const { requireAdmin }         = require('../middleware/admin.middleware');

/* Public */
router.post('/login',  login);

/* Protected */
router.post('/logout', requireAuth, requireAdmin, logout);
router.get('/me',      requireAuth, requireAdmin, getMe);

module.exports = router;
