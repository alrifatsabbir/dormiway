/* ============================================================
   users.routes.js — User authentication & profile routes
   ============================================================ */
'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const usersController = require('../controllers/users.controller');

/* ── Public routes ── */
router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.post('/password-reset', usersController.requestPasswordReset);
router.put('/password-reset/:token', usersController.resetPassword);

/* ── Protected routes (user) ── */
router.post('/logout', requireAuth, usersController.logout);
router.get('/me', requireAuth, usersController.getMe);
router.put('/:id', requireAuth, usersController.updateProfile);

module.exports = router;
