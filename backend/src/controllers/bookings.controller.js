/* ============================================================
   bookings.controller.js — Booking/Reservation management
   ============================================================ */
'use strict';

const {
  createBooking,
  findBookingById,
  getUserBookings,
  getAllBookings,
  getBookingCount,
  updateBookingStatus,
  cancelBooking,
  updateBookingDates,
  getUpcomingCheckIns
} = require('../models/booking.model');

const {
  findRoomById,
  checkRoomAvailability,
  markDatesAsBooked,
  markDatesAsAvailable,
  getUnavailableDates
} = require('../models/room.model');

const {
  addGuest,
  getBookingGuests
} = require('../models/guest.model');

/**
 * POST /api/bookings
 * Create new booking
 */
async function createNewBooking(req, res) {
  const { roomId, checkInDate, checkOutDate, guests, specialRequests } = req.body;
  const userId = req.user.id;

  /* ── Input validation ── */
  if (!roomId || !checkInDate || !checkOutDate || !guests) {
    return res.status(400).json({ message: 'Room ID, check-in date, check-out date, and guest count are required.' });
  }

  if (!roomId || isNaN(guests) || Number(guests) < 1) {
    return res.status(400).json({ message: 'Invalid room ID or guest count.' });
  }

  try {
    /* ── Validate room exists ── */
    const room = await findRoomById(String(roomId));
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

    /* ── Validate capacity ── */
    if (parseInt(guests) > room.capacity) {
      return res.status(400).json({ message: `Room capacity is ${room.capacity} guests.` });
    }

    /* ── Check room availability ── */
    const available = await checkRoomAvailability(
      String(roomId),
      checkInDate,
      checkOutDate
    );

    if (!available) {
      const unavailableDates = await getUnavailableDates(
        String(roomId),
        checkInDate,
        checkOutDate
      );
      return res.status(409).json({
        message: 'Room not available for selected dates',
        unavailableDates
      });
    }

    /* ── Calculate nights and total price ── */
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.price_per_night;

    /* ── Create booking ── */
    const booking = await createBooking({
      userId,
      roomId: String(roomId),
      checkInDate,
      checkOutDate,
      nights,
      guests: parseInt(guests),
      pricePerNight: room.price_per_night,
      totalPrice,
      specialRequests: specialRequests ? specialRequests.trim() : null
    });

    /* ── Mark room dates as booked ── */
    await markDatesAsBooked(
      String(roomId),
      booking.id,
      checkInDate,
      checkOutDate
    );

    return res.status(201).json({
      id: booking.id,
      userId,
      roomId: String(roomId),
      bookingNumber: booking.bookingNumber,
      checkInDate,
      checkOutDate,
      nights,
      guests: parseInt(guests),
      pricePerNight: room.price_per_night,
      totalPrice,
      status: 'pending',
      specialRequests: specialRequests ? specialRequests.trim() : null,
      createdAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Bookings] createNewBooking error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/bookings/:id
 * Get booking details
 */
async function getBookingDetail(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const booking = await findBookingById(String(id));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    /* ── Authorization check (user can only see their own bookings) ── */
    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }

    return res.status(200).json({
      id: booking.id,
      userId: booking.user_id,
      roomId: booking.room_id,
      bookingNumber: booking.booking_number,
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date,
      nights: booking.nights,
      guests: booking.guests,
      pricePerNight: booking.price_per_night,
      totalPrice: booking.total_price,
      status: booking.status,
      specialRequests: booking.special_requests,
      room: {
        name: booking.roomName,
        type: booking.roomType
      },
      createdAt: booking.created_at
    });

  } catch (err) {
    console.error('[Bookings] getBookingDetail error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/bookings
 * Get all bookings for current user
 */
async function getUserBookingsList(req, res) {
  const { status, limit = 10, page = 1 } = req.query;
  const userId = req.user.id;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const bookings = await getUserBookings(
      userId,
      status || null,
      parseInt(limit),
      offset
    );

    const total = await getBookingCount(status || null);

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      bookingNumber: b.booking_number,
      roomName: b.roomName,
      checkInDate: b.check_in_date,
      checkOutDate: b.check_out_date,
      totalPrice: b.total_price,
      status: b.status,
      createdAt: b.created_at
    }));

    return res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      bookings: formattedBookings
    });

  } catch (err) {
    console.error('[Bookings] getUserBookingsList error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * PUT /api/bookings/:id
 * Update booking (change dates or guest count)
 */
async function updateBooking(req, res) {
  const { id } = req.params;
  const { checkInDate, checkOutDate, guests } = req.body;
  const userId = req.user.id;

  try {
    const booking = await findBookingById(String(id));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    /* ── Authorization check ── */
    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }

    /* ── Check if booking can be modified ── */
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking cannot be modified in current status.' });
    }

    const newCheckIn = checkInDate || booking.check_in_date;
    const newCheckOut = checkOutDate || booking.check_out_date;
    const newGuests = guests || booking.guests;

    /* ── Validate dates if changed ── */
    if (checkInDate || checkOutDate) {
      const checkIn = new Date(newCheckIn);
      const checkOut = new Date(newCheckOut);

      if (checkOut <= checkIn) {
        return res.status(400).json({ message: 'Check-out date must be after check-in date.' });
      }

      /* ── Check new availability (excluding current booking) ── */
      if (newCheckIn !== booking.check_in_date || newCheckOut !== booking.check_out_date) {
        const available = await checkRoomAvailability(
          booking.room_id,
          newCheckIn,
          newCheckOut
        );

        if (!available) {
          const unavailableDates = await getUnavailableDates(
            booking.room_id,
            newCheckIn,
            newCheckOut
          );
          return res.status(409).json({
            message: 'New dates are not available',
            unavailableDates
          });
        }

        /* ── Update room availability ── */
        await markDatesAsAvailable(booking.room_id, booking.check_in_date, booking.check_out_date);
        await markDatesAsBooked(booking.room_id, booking.id, newCheckIn, newCheckOut);
      }
    }

    /* ── Validate capacity if changed ── */
    if (guests) {
      const room = await findRoomById(booking.room_id);
      if (guests > room.capacity) {
        return res.status(400).json({ message: `Room capacity is ${room.capacity} guests.` });
      }
    }

    /* ── Calculate new price if dates changed ── */
    const checkIn = new Date(newCheckIn);
    const checkOut = new Date(newCheckOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * booking.price_per_night;

    /* ── Update booking ── */
    await updateBookingDates(
      String(id),
      newCheckIn,
      newCheckOut,
      nights,
      totalPrice,
      booking.price_per_night
    );

    return res.status(200).json({
      id: String(id),
      message: 'Booking updated successfully'
    });

  } catch (err) {
    console.error('[Bookings] updateBooking error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * PUT /api/bookings/:id/cancel
 * Cancel booking
 */
async function cancelBookingRequest(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  try {
    const booking = await findBookingById(String(id));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    /* ── Authorization check ── */
    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }

    /* ── Check if booking can be cancelled ── */
    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'checked_in') {
      return res.status(400).json({ message: 'Booking cannot be cancelled in current status.' });
    }

    /* ── Cancel booking ── */
    await cancelBooking(String(id));

    /* ── Release room availability ── */
    await markDatesAsAvailable(booking.room_id, booking.check_in_date, booking.check_out_date);

    /* ── Calculate refund (100% for now) ── */
    const refundAmount = booking.total_price;

    return res.status(200).json({
      id: String(id),
      status: 'cancelled',
      refundAmount,
      message: 'Booking cancelled successfully',
      reason: reason ? reason.trim() : null
    });

  } catch (err) {
    console.error('[Bookings] cancelBookingRequest error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * POST /api/bookings/:id/guests
 * Add guest information to booking
 */
async function addGuestInfo(req, res) {
  const { id } = req.params;
  const { firstName, lastName, email, phone, nationality, passportNumber } = req.body;
  const userId = req.user.id;

  /* ── Input validation ── */
  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'First name and last name are required.' });
  }

  try {
    const booking = await findBookingById(String(id));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    /* ── Authorization check ── */
    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }

    /* ── Add guest ── */
    const guestId = await addGuest({
      bookingId: String(id),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      nationality: nationality ? nationality.trim() : null,
      passportNumber: passportNumber ? passportNumber.trim() : null
    });

    return res.status(201).json({
      id: guestId,
      bookingId: String(id),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      nationality: nationality ? nationality.trim() : null,
      passportNumber: passportNumber ? passportNumber.trim() : null
    });

  } catch (err) {
    console.error('[Bookings] addGuestInfo error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/bookings/:id/guests
 * Get guest information for booking
 */
async function getBookingGuestsList(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const booking = await findBookingById(String(id));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    /* ── Authorization check ── */
    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }

    const guests = await getBookingGuests(String(id));

    return res.status(200).json({
      bookingId: String(id),
      guests
    });

  } catch (err) {
    console.error('[Bookings] getBookingGuestsList error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/reservations
 * Get all reservations (admin only)
 */
async function getAllReservations(req, res) {
  const { status, roomId, sortBy = 'created_at', limit = 20, page = 1 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const bookings = await getAllBookings(
      {
        status: status || null,
        roomId: roomId ? String(roomId) : null,
        sortBy: sortBy || 'created_at',
        order: 'DESC'
      },
      parseInt(limit),
      offset
    );

    const total = await getBookingCount(status || null);

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      bookingNumber: b.booking_number,
      guestName: `${b.firstName} ${b.lastName}`,
      roomName: b.roomName,
      checkInDate: b.check_in_date,
      checkOutDate: b.check_out_date,
      nights: b.nights,
      totalPrice: b.total_price,
      status: b.status,
      createdAt: b.created_at
    }));

    return res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      reservations: formattedBookings
    });

  } catch (err) {
    console.error('[Bookings] getAllReservations error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/reservations/:id
 * Get detailed reservation view (admin only)
 */
async function getReservationDetail(req, res) {
  const { id } = req.params;

  try {
    const booking = await findBookingById(String(id));

    if (!booking) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const guests = await getBookingGuests(String(id));

    return res.status(200).json({
      id: booking.id,
      bookingNumber: booking.booking_number,
      guest: {
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phone: booking.phone
      },
      room: {
        id: booking.room_id,
        name: booking.roomName,
        type: booking.roomType
      },
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date,
      nights: booking.nights,
      guests: booking.guests,
      totalPrice: booking.total_price,
      status: booking.status,
      specialRequests: booking.special_requests,
      guestsList: guests,
      createdAt: booking.created_at
    });

  } catch (err) {
    console.error('[Bookings] getReservationDetail error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * PUT /api/admin/reservations/:id/status
 * Update reservation status (admin only)
 */
async function updateReservationStatus(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  try {
    const booking = await findBookingById(String(id));

    if (!booking) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    await updateBookingStatus(String(id), status, notes);

    return res.status(200).json({
      id: String(id),
      status,
      message: 'Reservation status updated successfully'
    });

  } catch (err) {
    console.error('[Bookings] updateReservationStatus error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/dashboard/upcoming-checkins
 * Get upcoming check-ins (admin only)
 */
async function getUpcomingCheckInsView(req, res) {
  const { days = 7 } = req.query;

  try {
    const checkIns = await getUpcomingCheckIns(parseInt(days));

    const formatted = checkIns.map(c => ({
      bookingNumber: c.booking_number,
      guestName: `${c.firstName} ${c.lastName}`,
      roomName: c.roomName,
      checkInDate: c.check_in_date,
      nights: c.nights,
      totalPrice: c.total_price,
      status: c.status
    }));

    return res.status(200).json({
      totalUpcoming: formatted.length,
      checkIns: formatted
    });

  } catch (err) {
    console.error('[Bookings] getUpcomingCheckInsView error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  createNewBooking,
  getBookingDetail,
  getUserBookingsList,
  updateBooking,
  cancelBookingRequest,
  addGuestInfo,
  getBookingGuestsList,
  getAllReservations,
  getReservationDetail,
  updateReservationStatus,
  getUpcomingCheckInsView
};
