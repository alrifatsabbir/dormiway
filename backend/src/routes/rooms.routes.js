/* ============================================================
   rooms.routes.js — Room management routes
   ============================================================ */
'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const roomsController = require('../controllers/rooms.controller');

/* ── Static routes (must come before :id routes) ── */
router.get('/availability/calendar', roomsController.getAvailabilityCalendarView);

/* ── Public routes ── */
router.get('/', roomsController.listRooms);
router.get('/:id', roomsController.getRoomDetails);
router.post('/:id/availability', roomsController.checkAvailability);

/* ── Admin routes ── */
router.post('/', requireAuth, requireAdmin, roomsController.createRoomAdmin);
router.put('/:id', requireAuth, requireAdmin, roomsController.updateRoomAdmin);
router.delete('/:id', requireAuth, requireAdmin, roomsController.deleteRoomAdmin);

module.exports = router;
