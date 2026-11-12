/* ============================================================
   invoice.model.js — Invoice Mongoose Schema & Queries
   ============================================================ */
'use strict';

const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    invoice_number: { type: String, required: true, unique: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax_rate: { type: Number, required: true, default: 0 },
    tax_amount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['draft', 'issued', 'paid', 'void'], default: 'draft' },
    issued_at: { type: Date, default: Date.now },
    paid_at: { type: Date, default: null },
  },
  { timestamps: true }
);

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

async function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `INV-${year}${month}-${random}`;
}

function formatInvoice(doc) {
  if (!doc) return null;
  const payment = doc.payment_id && typeof doc.payment_id === 'object' && doc.payment_id.transaction_id ? doc.payment_id : null;
  const booking = payment?.booking_id && typeof payment.booking_id === 'object' ? payment.booking_id : null;
  const user = booking?.user_id && typeof booking.user_id === 'object' ? booking.user_id : null;
  const room = booking?.room_id && typeof booking.room_id === 'object' ? booking.room_id : null;

  return {
    ...doc,
    id: doc._id.toString(),
    payment_id: payment ? payment._id.toString() : doc.payment_id?.toString(),
    transaction_id: payment?.transaction_id,
    payment_method: payment?.payment_method,
    booking_number: booking?.booking_number,
    check_in_date: booking?.check_in_date,
    check_out_date: booking?.check_out_date,
    nights: booking?.nights,
    price_per_night: booking?.price_per_night,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    roomName: room?.name,
  };
}

async function createInvoice(invoiceData) {
  const { paymentId, subtotal, taxRate, taxAmount, total } = invoiceData;
  const invoiceNumber = await generateInvoiceNumber();

  const doc = await Invoice.create({
    payment_id: paymentId,
    invoice_number: invoiceNumber,
    subtotal: Number(subtotal),
    tax_rate: Number(taxRate),
    tax_amount: Number(taxAmount),
    total: Number(total),
    status: 'draft',
  });
  return doc._id.toString();
}

async function findInvoiceById(invoiceId) {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) return null;
  const doc = await Invoice.findById(invoiceId)
    .populate({
      path: 'payment_id',
      populate: {
        path: 'booking_id',
        populate: [
          { path: 'user_id', select: 'firstName lastName email' },
          { path: 'room_id', select: 'name' },
        ],
      },
    })
    .lean();
  return formatInvoice(doc);
}

async function findInvoiceByPaymentId(paymentId) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) return null;
  const doc = await Invoice.findOne({ payment_id: paymentId }).lean();
  return formatInvoice(doc);
}

async function updateInvoiceStatus(invoiceId, newStatus) {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) return;
  await Invoice.findByIdAndUpdate(invoiceId, {
    status: newStatus,
    paid_at: newStatus === 'paid' ? new Date() : null,
  });
}

async function getAllInvoices(limit = 20, offset = 0) {
  const docs = await Invoice.find()
    .populate({
      path: 'payment_id',
      populate: {
        path: 'booking_id',
        populate: [
          { path: 'user_id', select: 'firstName lastName email' },
          { path: 'room_id', select: 'name' },
        ],
      },
    })
    .sort({ issued_at: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  return docs.map(formatInvoice);
}

module.exports = {
  Invoice,
  generateInvoiceNumber,
  createInvoice,
  findInvoiceById,
  findInvoiceByPaymentId,
  updateInvoiceStatus,
  getAllInvoices,
};
