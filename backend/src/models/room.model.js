/* ============================================================
   room.model.js — Room & Availability Mongoose Schemas
   ============================================================ */
'use strict';

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    capacity: { type: Number, required: true, min: 1 },
    price_per_night: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    is_available: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const roomAvailabilitySchema = new mongoose.Schema(
  {
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    available_date: { type: String, required: true }, // YYYY-MM-DD
    is_available: { type: Boolean, default: true },
  },
  { timestamps: true }
);
roomAvailabilitySchema.index({ room_id: 1, available_date: 1 }, { unique: true });

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
const RoomAvailability = mongoose.models.RoomAvailability || mongoose.model('RoomAvailability', roomAvailabilitySchema);

function formatRoom(doc) {
  if (!doc) return null;
  return { ...doc, id: doc._id.toString() };
}

async function findRoomById(roomId) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) return null;
  const doc = await Room.findById(roomId).lean();
  return formatRoom(doc);
}

async function getAllRooms(filters = {}) {
  const { type, sortBy = 'name', order = 'ASC', limit = 20, offset = 0 } = filters;
  const query = {};
  if (type) query.type = type;

  const allowedSort = ['name', 'type', 'capacity', 'price_per_night', 'created_at'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'name';
  const sortDir = String(order).toUpperCase() === 'DESC' ? -1 : 1;

  const docs = await Room.find(query)
    .sort({ [sortField]: sortDir })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  return docs.map(formatRoom);
}

async function getRoomCount(type = null) {
  const query = { is_available: true };
  if (type) query.type = type;
  return Room.countDocuments(query);
}

async function createRoom(roomData) {
  const { name, type, description, capacity, pricePerNight, amenities, images } = roomData;
  const doc = await Room.create({
    name,
    type,
    description: description || null,
    capacity: Number(capacity),
    price_per_night: Number(pricePerNight),
    amenities: Array.isArray(amenities) ? amenities : [],
    images: Array.isArray(images) ? images : [],
    is_available: true,
  });
  return doc._id.toString();
}

async function updateRoom(roomId, roomData) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) return;
  const { name, description, capacity, pricePerNight, amenities, images, isAvailable } = roomData;
  await Room.findByIdAndUpdate(roomId, {
    name,
    description: description || null,
    capacity: Number(capacity),
    price_per_night: Number(pricePerNight),
    amenities: Array.isArray(amenities) ? amenities : [],
    images: Array.isArray(images) ? images : [],
    is_available: isAvailable !== undefined ? isAvailable : true,
  });
}

async function deleteRoom(roomId) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) return;
  await Room.findByIdAndDelete(roomId);
  await RoomAvailability.deleteMany({ room_id: roomId });
}

async function checkRoomAvailability(roomId, checkInDate, checkOutDate) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) return false;
  const conflict = await RoomAvailability.findOne({
    room_id: roomId,
    available_date: { $gte: checkInDate, $lt: checkOutDate },
    is_available: false,
  }).lean();
  return !conflict;
}

async function getUnavailableDates(roomId, checkInDate, checkOutDate) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) return [];
  const rows = await RoomAvailability.find({
    room_id: roomId,
    available_date: { $gte: checkInDate, $lt: checkOutDate },
    is_available: false,
  }).lean();
  return rows.map((r) => r.available_date);
}

async function markDatesAsBooked(roomId, bookingId, checkInDate, checkOutDate) {
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);

  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    await RoomAvailability.findOneAndUpdate(
      { room_id: roomId, available_date: dateStr },
      { room_id: roomId, booking_id: bookingId, available_date: dateStr, is_available: false },
      { upsert: true, new: true }
    );
  }
}

async function markDatesAsAvailable(roomId, checkInDate, checkOutDate) {
  const res = await RoomAvailability.updateMany(
    {
      room_id: roomId,
      available_date: { $gte: checkInDate, $lt: checkOutDate },
    },
    { is_available: true, booking_id: null }
  );
  return res.modifiedCount || 0;
}

async function getAvailabilityCalendar(roomId, month, year) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) return [];
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  return RoomAvailability.find({
    room_id: roomId,
    available_date: { $gte: startDate, $lte: endDate },
  })
    .select('available_date is_available -_id')
    .sort({ available_date: 1 })
    .lean();
}

module.exports = {
  Room,
  RoomAvailability,
  findRoomById,
  getAllRooms,
  getRoomCount,
  createRoom,
  updateRoom,
  deleteRoom,
  checkRoomAvailability,
  getUnavailableDates,
  markDatesAsBooked,
  markDatesAsAvailable,
  getAvailabilityCalendar,
};
