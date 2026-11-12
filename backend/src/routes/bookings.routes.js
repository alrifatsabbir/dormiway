/* ============================================================
   bookings.routes.js — Booking/Reservation routes
   ============================================================ */
'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const bookingsController = require('../controllers/bookings.controller');

/* ── Admin routes (must come before :id routes to avoid conflicts) ── */
router.get('/admin/reservations', requireAuth, requireAdmin, bookingsController.getAllReservations);
router.get('/admin/reservations/:id', requireAuth, requireAdmin, bookingsController.getReservationDetail);
router.put('/admin/reservations/:id/status', requireAuth, requireAdmin, bookingsController.updateReservationStatus);

/* ── User routes ── */
router.post('/', requireAuth, bookingsController.createNewBooking);
router.get('/', requireAuth, bookingsController.getUserBookingsList);
router.get('/:id', requireAuth, bookingsController.getBookingDetail);
router.put('/:id', requireAuth, bookingsController.updateBooking);
router.put('/:id/cancel', requireAuth, bookingsController.cancelBookingRequest);

/* ── Guest management routes ── */
router.post('/:id/guests', requireAuth, bookingsController.addGuestInfo);
router.get('/:id/guests', requireAuth, bookingsController.getBookingGuestsList);

module.exports = router;
