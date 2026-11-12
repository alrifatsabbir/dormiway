/* ============================================================
   booking.model.js — Booking/Reservation Mongoose Schema
   ============================================================ */
'use strict';

const mongoose = require('mongoose');
const { Room } = require('./room.model');

const bookingSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    booking_number: { type: String, required: true, unique: true },
    check_in_date: { type: String, required: true },  // YYYY-MM-DD
    check_out_date: { type: String, required: true }, // YYYY-MM-DD
    nights: { type: Number, required: true, min: 1 },
    guests: { type: Number, required: true, min: 1 },
    price_per_night: { type: Number, required: true, min: 0 },
    total_price: { type: Number, required: true, min: 0 },
    special_requests: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

async function generateBookingNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BK-${timestamp}-${random}`;
}

function formatBooking(doc) {
  if (!doc) return null;
  const room = doc.room_id && typeof doc.room_id === 'object' && doc.room_id.name ? doc.room_id : null;
  const user = doc.user_id && typeof doc.user_id === 'object' && doc.user_id.email ? doc.user_id : null;

  return {
    ...doc,
    id: doc._id.toString(),
    user_id: user ? user._id.toString() : doc.user_id?.toString(),
    room_id: room ? room._id.toString() : doc.room_id?.toString(),
    roomName: room ? room.name : undefined,
    roomType: room ? room.type : undefined,
    roomPrice: room ? room.price_per_night : undefined,
    firstName: user ? user.firstName : undefined,
    lastName: user ? user.lastName : undefined,
    email: user ? user.email : undefined,
  };
}

async function createBooking(bookingData) {
  const {
    userId,
    roomId,
    checkInDate,
    checkOutDate,
    nights,
    guests,
    pricePerNight,
    totalPrice,
    specialRequests,
  } = bookingData;

  const bookingNumber = await generateBookingNumber();
  const doc = await Booking.create({
    user_id: userId,
    room_id: roomId,
    booking_number: bookingNumber,
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    nights: Number(nights),
    guests: Number(guests),
    price_per_night: Number(pricePerNight),
    total_price: Number(totalPrice),
    special_requests: specialRequests || null,
    status: 'pending',
  });

  return { id: doc._id.toString(), bookingNumber };
}

async function findBookingById(bookingId) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return null;
  const doc = await Booking.findById(bookingId)
    .populate('room_id', 'name type price_per_night')
    .lean();
  return formatBooking(doc);
}

async function getUserBookings(userId, status = null, limit = 10, offset = 0) {
  const query = { user_id: userId };
  if (status) query.status = status;

  const docs = await Booking.find(query)
    .populate('room_id', 'name type')
    .sort({ created_at: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  return docs.map(formatBooking);
}

async function getAllBookings(filters = {}, limit = 20, offset = 0) {
  const { status, roomId, sortBy = 'created_at', order = 'DESC' } = filters;
  const query = {};
  if (status) query.status = status;
  if (roomId && mongoose.Types.ObjectId.isValid(roomId)) query.room_id = roomId;

  const allowedSort = ['created_at', 'check_in_date', 'check_out_date', 'total_price', 'status'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const sortDir = String(order).toUpperCase() === 'ASC' ? 1 : -1;

  const docs = await Booking.find(query)
    .populate('user_id', 'firstName lastName email')
    .populate('room_id', 'name')
    .sort({ [sortField]: sortDir })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  return docs.map(formatBooking);
}

async function getBookingCount(status = null) {
  const query = status ? { status } : {};
  return Booking.countDocuments(query);
}

async function updateBookingStatus(bookingId, newStatus) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return;
  await Booking.findByIdAndUpdate(bookingId, { status: newStatus });
}

async function cancelBooking(bookingId) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return;
  await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
}

async function updateBookingDates(bookingId, checkInDate, checkOutDate, nights, totalPrice, pricePerNight) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return;
  await Booking.findByIdAndUpdate(bookingId, {
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    nights: Number(nights),
    total_price: Number(totalPrice),
    price_per_night: Number(pricePerNight),
  });
}

async function getUpcomingCheckIns(days = 7) {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Number(days));
  const futureStr = futureDate.toISOString().split('T')[0];

  const docs = await Booking.find({
    check_in_date: { $gte: today, $lte: futureStr },
    status: { $in: ['pending', 'confirmed'] },
  })
    .populate('user_id', 'firstName lastName email')
    .populate('room_id', 'name price_per_night')
    .sort({ check_in_date: 1 })
    .lean();

  return docs.map(formatBooking);
}

async function getRevenueStats(fromDate = null, toDate = null) {
  const match = { status: { $in: ['completed', 'confirmed'] } };
  if (fromDate || toDate) {
    match.created_at = {};
    if (fromDate) match.created_at.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      match.created_at.$lte = end;
    }
  }

  const [agg] = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$total_price' },
        averageBookingValue: { $avg: '$total_price' },
      },
    },
  ]);

  return {
    totalBookings: agg?.totalBookings || 0,
    totalRevenue: agg?.totalRevenue || 0,
    averageBookingValue: agg?.averageBookingValue || 0,
  };
}

async function getOccupancyRate() {
  const today = new Date().toISOString().split('T')[0];
  const [occupiedRoomIds, totalRooms] = await Promise.all([
    Booking.distinct('room_id', {
      check_in_date: { $lte: today },
      check_out_date: { $gt: today },
      status: { $in: ['confirmed', 'checked_in'] },
    }),
    Room.countDocuments(),
  ]);

  const occupiedRooms = occupiedRoomIds.length;
  const occupancyPercent = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2)) : 0;

  return { occupiedRooms, totalRooms, occupancyPercent };
}

module.exports = {
  Booking,
  generateBookingNumber,
  createBooking,
  findBookingById,
  getUserBookings,
  getAllBookings,
  getBookingCount,
  updateBookingStatus,
  cancelBooking,
  updateBookingDates,
  getUpcomingCheckIns,
  getRevenueStats,
  getOccupancyRate,
};
