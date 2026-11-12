/* ============================================================
   payment.model.js — Payment Mongoose Schema & Queries
   ============================================================ */
'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    transaction_id: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    payment_method: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paid_at: { type: Date, default: null },
    refund_amount: { type: Number, default: 0 },
    refunded_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

function formatPayment(doc) {
  if (!doc) return null;
  const booking = doc.booking_id && typeof doc.booking_id === 'object' && doc.booking_id.booking_number ? doc.booking_id : null;
  const user = booking?.user_id && typeof booking.user_id === 'object' ? booking.user_id : null;
  const room = booking?.room_id && typeof booking.room_id === 'object' ? booking.room_id : null;

  return {
    ...doc,
    id: doc._id.toString(),
    booking_id: booking ? booking._id.toString() : doc.booking_id?.toString(),
    booking_number: booking?.booking_number,
    check_in_date: booking?.check_in_date,
    check_out_date: booking?.check_out_date,
    nights: booking?.nights,
    total_price: booking?.total_price,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    roomName: room?.name,
  };
}

async function createPayment(paymentData) {
  const { bookingId, transactionId, amount, paymentMethod, status = 'pending' } = paymentData;
  const finalStatus = status === 'completed' ? 'completed' : 'pending';
  const doc = await Payment.create({
    booking_id: bookingId,
    transaction_id: transactionId,
    amount: Number(amount),
    payment_method: paymentMethod,
    status: finalStatus,
    paid_at: finalStatus === 'completed' ? new Date() : null,
  });
  return doc._id.toString();
}

async function findPaymentById(paymentId) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) return null;
  const doc = await Payment.findById(paymentId)
    .populate({
      path: 'booking_id',
      populate: [
        { path: 'user_id', select: 'firstName lastName email' },
        { path: 'room_id', select: 'name' },
      ],
    })
    .lean();
  return formatPayment(doc);
}

async function findPaymentByTransactionId(transactionId) {
  const doc = await Payment.findOne({ transaction_id: transactionId }).lean();
  return formatPayment(doc);
}

async function getUserPayments(userId, status = null, limit = 10, offset = 0) {
  const { Booking } = require('./booking.model');
  const userBookings = await Booking.find({ user_id: userId }).select('_id').lean();
  const bookingIds = userBookings.map((b) => b._id);

  const query = { booking_id: { $in: bookingIds } };
  if (status) query.status = status;

  const docs = await Payment.find(query)
    .populate({
      path: 'booking_id',
      select: 'booking_number total_price room_id',
      populate: { path: 'room_id', select: 'name' },
    })
    .sort({ created_at: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  return docs.map(formatPayment);
}

async function getAllPayments(filters = {}, limit = 20, offset = 0) {
  const { status, fromDate, toDate, sortBy = 'paid_at', order = 'DESC' } = filters;
  const query = {};
  if (status) query.status = status;
  if (fromDate || toDate) {
    query.paid_at = {};
    if (fromDate) query.paid_at.$gte = new Date(fromDate);
    if (toDate) query.paid_at.$lte = new Date(toDate);
  }

  const allowedSort = ['paid_at', 'created_at', 'amount', 'status'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'paid_at';
  const sortDir = String(order).toUpperCase() === 'ASC' ? 1 : -1;

  const docs = await Payment.find(query)
    .populate({
      path: 'booking_id',
      select: 'booking_number user_id room_id',
      populate: [
        { path: 'user_id', select: 'firstName lastName email' },
        { path: 'room_id', select: 'name' },
      ],
    })
    .sort({ [sortField]: sortDir })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  return docs.map(formatPayment);
}

async function updatePaymentStatus(paymentId, newStatus) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) return;
  await Payment.findByIdAndUpdate(paymentId, {
    status: newStatus,
    paid_at: newStatus === 'completed' ? new Date() : null,
  });
}

async function createRefund(paymentId, refundAmount) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) return;
  await Payment.findByIdAndUpdate(paymentId, {
    status: 'refunded',
    refund_amount: Number(refundAmount),
    refunded_at: new Date(),
  });
}

async function getPaymentCount(status = null) {
  const query = status ? { status } : {};
  return Payment.countDocuments(query);
}

async function getTotalRevenue(fromDate = null, toDate = null) {
  const match = { status: 'completed' };
  if (fromDate || toDate) {
    match.paid_at = {};
    if (fromDate) match.paid_at.$gte = new Date(fromDate);
    if (toDate) match.paid_at.$lte = new Date(toDate);
  }

  const [agg] = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
  ]);
  return agg?.totalRevenue || 0;
}

module.exports = {
  Payment,
  createPayment,
  findPaymentById,
  findPaymentByTransactionId,
  getUserPayments,
  getAllPayments,
  updatePaymentStatus,
  createRefund,
  getPaymentCount,
  getTotalRevenue,
};
