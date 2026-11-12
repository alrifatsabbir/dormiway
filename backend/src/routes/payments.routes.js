/* ============================================================
   payments.routes.js — Payment processing routes
   ============================================================ */
'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const paymentsController = require('../controllers/payments.controller');

/* ── User routes (static paths before :id) ── */
router.post('/mock', requireAuth, paymentsController.processMockPayment);
router.post('/verify', requireAuth, paymentsController.verifyPayment);

/* ── Admin routes ── */
router.get('/admin/payments', requireAuth, requireAdmin, paymentsController.getAllPaymentsList);
router.get('/admin/payments/:id', requireAuth, requireAdmin, paymentsController.getAdminPaymentDetails);
router.put('/admin/payments/:id/status', requireAuth, requireAdmin, paymentsController.updatePaymentStatusAdmin);
router.post('/admin/payments/:id/refund', requireAuth, requireAdmin, paymentsController.processRefund);

/* ── Parameterized routes ── */
router.get('/:id', requireAuth, paymentsController.getPaymentDetails);
router.get('/user/:userId/payments', requireAuth, paymentsController.getUserPaymentsList);

module.exports = router;
