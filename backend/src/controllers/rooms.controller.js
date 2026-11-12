/* ============================================================
   rooms.controller.js — Room management & availability
   ============================================================ */
'use strict';

const {
  findRoomById,
  getAllRooms,
  getRoomCount,
  createRoom,
  updateRoom,
  deleteRoom,
  checkRoomAvailability,
  getUnavailableDates,
  getAvailabilityCalendar
} = require('../models/room.model');

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  return [];
}

/**
 * GET /api/rooms
 * Get all rooms with filters, sorting, and pagination
 */
async function listRooms(req, res) {
  const { type, sortBy = 'name', order = 'asc', limit = 20, page = 1 } = req.query;

  try {
    /* ── Validate and sanitize inputs ── */
    const validSortFields = ['name', 'price_per_night', 'capacity', 'type', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    /* ── Get total count ── */
    const total = await getRoomCount(type || null);

    /* ── Get rooms ── */
    const rooms = await getAllRooms({
      type: type || null,
      sortBy: sortField,
      order: sortOrder,
      limit: limitNum,
      offset
    });

    /* ── Format response ── */
    const formattedRooms = rooms.map(room => ({
      id: room.id,
      name: room.name,
      type: room.type,
      description: room.description,
      price: room.price_per_night,
      price_per_night: room.price_per_night,
      capacity: room.capacity,
      amenities: toArray(room.amenities),
      images: toArray(room.images),
      rating: room.rating || 0,
      available: room.is_available,
      is_available: room.is_available
    }));

    return res.status(200).json({
      total,
      page: pageNum,
      limit: limitNum,
      rooms: formattedRooms
    });

  } catch (err) {
    console.error('[Rooms] listRooms error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/rooms/:id
 * Get room details by ID
 */
async function getRoomDetails(req, res) {
  const { id } = req.params;

  try {
    const room = await findRoomById(String(id));

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    return res.status(200).json({
      id: room.id,
      name: room.name,
      type: room.type,
      description: room.description,
      price: room.price_per_night,
      price_per_night: room.price_per_night,
      capacity: room.capacity,
      amenities: toArray(room.amenities),
      images: toArray(room.images),
      rating: room.rating || 0,
      available: room.is_available,
      is_available: room.is_available,
      createdAt: room.created_at
    });

  } catch (err) {
    console.error('[Rooms] getRoomDetails error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * POST /api/rooms
 * Create new room (admin only)
 */
async function createRoomAdmin(req, res) {
  const { name, type, description, capacity, price, amenities, images } = req.body;

  /* ── Input validation ── */
  if (!name || !type || !capacity || !price) {
    return res.status(400).json({ message: 'Name, type, capacity, and price are required.' });
  }

  if (typeof name !== 'string' || typeof type !== 'string') {
    return res.status(400).json({ message: 'Invalid input types.' });
  }

  if (isNaN(capacity) || isNaN(price) || capacity < 1 || price < 0) {
    return res.status(400).json({ message: 'Capacity must be positive and price must be non-negative.' });
  }

  try {
    const roomId = await createRoom({
      name: name.trim(),
      type: type.toLowerCase().trim(),
      description: description ? description.trim() : null,
      capacity: parseInt(capacity),
      pricePerNight: parseFloat(price),
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) ? images : []
    });

    return res.status(201).json({
      id: roomId,
      message: 'Room created successfully'
    });

  } catch (err) {
    console.error('[Rooms] createRoomAdmin error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * PUT /api/rooms/:id
 * Update room details (admin only)
 */
async function updateRoomAdmin(req, res) {
  const { id } = req.params;
  const { name, description, capacity, price, amenities, images, available } = req.body;

  /* ── Check if room exists ── */
  try {
    const room = await findRoomById(String(id));
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    /* ── Update room ── */
    await updateRoom(String(id), {
      name: name !== undefined ? name.trim() : room.name,
      description: description !== undefined ? description.trim() : room.description,
      capacity: capacity !== undefined ? parseInt(capacity) : room.capacity,
      pricePerNight: price !== undefined ? parseFloat(price) : room.price_per_night,
      amenities: toArray(amenities !== undefined ? amenities : room.amenities),
      images: toArray(images !== undefined ? images : room.images),
      isAvailable: available !== undefined ? available : room.is_available
    });

    return res.status(200).json({
      id: String(id),
      message: 'Room updated successfully'
    });

  } catch (err) {
    console.error('[Rooms] updateRoomAdmin error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * DELETE /api/rooms/:id
 * Delete room (admin only)
 */
async function deleteRoomAdmin(req, res) {
  const { id } = req.params;

  try {
    const room = await findRoomById(String(id));
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    await deleteRoom(String(id));

    return res.status(200).json({ message: 'Room deleted successfully' });

  } catch (err) {
    console.error('[Rooms] deleteRoomAdmin error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * POST /api/rooms/:id/availability
 * Check room availability for date range
 */
async function checkAvailability(req, res) {
  const { id } = req.params;
  const { checkInDate, checkOutDate, guests } = req.body;

  /* ── Input validation ── */
  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({ message: 'Check-in and check-out dates are required.' });
  }

  try {
    /* ── Validate room exists ── */
    const room = await findRoomById(String(id));
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    /* ── Validate dates ── */
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date.' });
    }

    if (guests && room.capacity < guests) {
      return res.status(400).json({ message: `Room capacity is ${room.capacity} guests.` });
    }

    /* ── Check availability ── */
    const available = await checkRoomAvailability(
      String(id),
      checkInDate,
      checkOutDate
    );

    if (available) {
      /* ── Calculate price ── */
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * room.price_per_night;

      return res.status(200).json({
        roomId: String(id),
        available: true,
        checkInDate,
        checkOutDate,
        nights,
        pricePerNight: room.price_per_night,
        totalPrice,
        message: 'Room is available for selected dates'
      });
    } else {
      /* ── Get unavailable dates ── */
      const unavailableDates = await getUnavailableDates(
        String(id),
        checkInDate,
        checkOutDate
      );

      return res.status(409).json({
        roomId: String(id),
        available: false,
        message: 'Room is booked for selected dates',
        unavailableDates
      });
    }

  } catch (err) {
    console.error('[Rooms] checkAvailability error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/rooms/availability/calendar
 * Get availability calendar for a room
 */
async function getAvailabilityCalendarView(req, res) {
  const { roomId, month, year } = req.query;

  /* ── Input validation ── */
  if (!roomId || !month || !year) {
    return res.status(400).json({ message: 'Room ID, month, and year are required.' });
  }

  const monthNum = parseInt(month);
  const yearNum = parseInt(year);

  if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid month or year.' });
  }

  try {
    /* ── Validate room exists ── */
    const room = await findRoomById(String(roomId));
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    /* ── Get availability ── */
    const availabilityData = await getAvailabilityCalendar(
      String(roomId),
      monthNum,
      yearNum
    );

    /* ── Format as calendar object ── */
    const availability = {};
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      availability[day] = true; // Default available
    }

    /* ── Mark booked dates ── */
    availabilityData.forEach(record => {
      const date = new Date(record.available_date);
      availability[date.getDate()] = record.is_available;
    });

    return res.status(200).json({
      roomId: String(roomId),
      month: monthNum,
      year: yearNum,
      availability
    });

  } catch (err) {
    console.error('[Rooms] getAvailabilityCalendarView error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  listRooms,
  getRoomDetails,
  createRoomAdmin,
  updateRoomAdmin,
  deleteRoomAdmin,
  checkAvailability,
  getAvailabilityCalendarView
};
