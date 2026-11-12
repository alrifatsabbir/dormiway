/* ============================================================
   guest.model.js — Guest Mongoose Schema & Queries
   ============================================================ */
'use strict';

const mongoose = require('mongoose');
const { User } = require('./user.model');
const { Booking } = require('./booking.model');

const guestSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    nationality: { type: String, default: null },
    passport_number: { type: String, default: null },
    date_of_birth: { type: String, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Guest = mongoose.models.Guest || mongoose.model('Guest', guestSchema);

async function addGuest(guestData) {
  const { bookingId, firstName, lastName, email, phone, nationality, passportNumber, dateOfBirth } = guestData;
  const doc = await Guest.create({
    booking_id: bookingId,
    firstName,
    lastName,
    email: email || null,
    phone: phone || null,
    nationality: nationality || null,
    passport_number: passportNumber || null,
    date_of_birth: dateOfBirth || null,
  });
  return doc._id.toString();
}

async function getBookingGuests(bookingId) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return [];
  const docs = await Guest.find({ booking_id: bookingId })
    .select('firstName lastName email phone nationality passport_number date_of_birth')
    .lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() }));
}

async function getAllGuests(limit = 20, offset = 0) {
  const rows = await User.aggregate([
    { $sort: { created_at: -1 } },
    { $skip: Number(offset) },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'user_id',
        as: 'bookings',
      },
    },
    {
      $project: {
        id: { $toString: '$_id' },
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        totalBookings: { $size: '$bookings' },
        totalSpent: { $sum: '$bookings.total_price' },
        joinedAt: '$created_at',
      },
    },
  ]);
  return rows;
}

async function getGuestDetail(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const user = await User.findById(userId)
    .select('firstName lastName email phone nationality passportNumber created_at')
    .lean();
  if (!user) return null;

  const bookings = await Booking.find({ user_id: userId })
    .select('booking_number check_in_date check_out_date nights total_price status')
    .sort({ created_at: -1 })
    .lean();

  return {
    ...user,
    id: user._id.toString(),
    bookings: bookings.map((b) => ({ ...b, id: b._id.toString() })),
  };
}

async function getGuestsCount() {
  return User.countDocuments();
}

async function searchGuests(searchTerm, limit = 20, offset = 0) {
  const regex = new RegExp(searchTerm, 'i');
  return User.aggregate([
    {
      $match: {
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
      },
    },
    { $sort: { created_at: -1 } },
    { $skip: Number(offset) },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'user_id',
        as: 'bookings',
      },
    },
    {
      $project: {
        id: { $toString: '$_id' },
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        totalBookings: { $size: '$bookings' },
        totalSpent: { $sum: '$bookings.total_price' },
        joinedAt: '$created_at',
      },
    },
  ]);
}

module.exports = {
  Guest,
  addGuest,
  getBookingGuests,
  getAllGuests,
  getGuestDetail,
  getGuestsCount,
  searchGuests,
};
