/* ============================================================
   admin.routes.js — Admin dashboard & management routes
   ============================================================ */
'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const dashboardController = require('../controllers/dashboard.controller');
const usersController = require('../controllers/users.controller');

/* ── All admin routes require authentication and admin role ── */
router.use(requireAuth, requireAdmin);

/* ── Guests routes ── */
router.get('/guests', usersController.getAllGuestsAdmin);
router.get('/guests/:id', usersController.getGuestDetail);

/* ── Dashboard routes ── */
router.get('/dashboard/overview', dashboardController.getDashboardOverview);
router.get('/dashboard/revenue', dashboardController.getRevenueAnalytics);
router.get('/dashboard/occupancy', dashboardController.getOccupancyStats);
router.get('/dashboard/upcoming-checkins', dashboardController.getUpcomingCheckInsView);

/* ── Reports routes ── */
router.get('/reports/summary', dashboardController.getReportSummary);
router.get('/reports/room-performance', dashboardController.getRoomPerformance);
router.get('/reports/guest-analysis', dashboardController.getGuestAnalysis);

module.exports = router;
