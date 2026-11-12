/* ============================================================
   payments.controller.js — Payment processing & verification
   ============================================================ */
'use strict';

const {
  createPayment,
  findPaymentById,
  findPaymentByTransactionId,
  getUserPayments,
  getAllPayments,
  updatePaymentStatus,
  createRefund,
  getTotalRevenue
} = require('../models/payment.model');

const { findBookingById, updateBookingStatus } = require('../models/booking.model');

/**
 * POST /api/payments/mock
 * Process mock payment (for testing - no real card processing)
 */
async function processMockPayment(req, res) {
  const { bookingId, amount, cardHolder, cardNumber, expiryMonth, expiryYear, cvv } = req.body;
  const userId = req.user.id;

  /* ── Input validation ── */
  if (!bookingId || !amount || !cardHolder || !cardNumber) {
    return res.status(400).json({ message: 'Booking ID, amount, card holder, and card number are required.' });
  }

  if (isNaN(bookingId) || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid booking ID or amount.' });
  }

  /* ── Mock card validation ── */
  if (!isValidMockCardNumber(cardNumber)) {
    return res.status(400).json({ message: 'Invalid card number.' });
  }

  if (expiryMonth < 1 || expiryMonth > 12 || expiryYear < new Date().getFullYear()) {
    return res.status(400).json({ message: 'Card expired or invalid expiry date.' });
  }

  if (!cvv || cvv.length < 3 || cvv.length > 4) {
    return res.status(400).json({ message: 'Invalid CVV.' });
  }

  try {
    /* ── Verify booking exists and belongs to user ── */
    const booking = await findBookingById(String(bookingId));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }

    /* ── Verify amount matches booking total ── */
    if (amount !== booking.total_price) {
      return res.status(400).json({ 
        message: 'Amount does not match booking total',
        expectedAmount: booking.total_price
      });
    }

    /* ── Generate transaction ID ── */
    const transactionId = generateTransactionId();

    /* ── Mock payment processing (95% success rate for demo) ── */
    const random = Math.random();
    const paymentStatus = random > 0.05 ? 'completed' : 'failed';

    if (paymentStatus === 'failed') {
      return res.status(402).json({ 
        message: 'Payment declined. Please try again or use a different card.',
        transactionId
      });
    }

    /* ── Create payment record ── */
    const paymentId = await createPayment({
      bookingId: String(bookingId),
      transactionId,
      amount: parseFloat(amount),
      paymentMethod: 'card',
      status: paymentStatus
    });

    /* ── Update booking status to confirmed ── */
    await updateBookingStatus(String(bookingId), 'confirmed');

    return res.status(201).json({
      id: paymentId,
      bookingId: String(bookingId),
      transactionId,
      amount: parseFloat(amount),
      status: paymentStatus,
      paymentMethod: 'card',
      paidAt: new Date().toISOString(),
      message: 'Payment processed successfully'
    });

  } catch (err) {
    console.error('[Payments] processMockPayment error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * POST /api/payments/verify
 * Verify payment status
 */
async function verifyPayment(req, res) {
  const { transactionId } = req.body;

  if (!transactionId) {
    return res.status(400).json({ message: 'Transaction ID is required.' });
  }

  try {
    const payment = await findPaymentByTransactionId(transactionId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    return res.status(200).json({
      transactionId,
      status: payment.status,
      amount: payment.amount,
      paidAt: payment.paid_at
    });

  } catch (err) {
    console.error('[Payments] verifyPayment error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/payments/:id
 * Get payment details
 */
async function getPaymentDetails(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const payment = await findPaymentById(String(id));

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    /* ── Check if user owns this payment ── */
    // Note: This is a simplified check - in production, verify via booking ownership
    if (payment.user_id && payment.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have access to this payment.' });
    }

    return res.status(200).json({
      id: payment.id,
      bookingId: payment.booking_id,
      transactionId: payment.transaction_id,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.payment_method,
      paidAt: payment.paid_at,
      roomName: payment.roomName,
      bookingNumber: payment.booking_number
    });

  } catch (err) {
    console.error('[Payments] getPaymentDetails error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/users/:userId/payments
 * Get all payments for user
 */
async function getUserPaymentsList(req, res) {
  const { userId } = req.params;
  const { status, limit = 10, page = 1 } = req.query;
  const currentUserId = req.user.id;

  /* ── Authorization check ── */
  if (String(userId) !== currentUserId) {
    return res.status(403).json({ message: 'You do not have access to these payments.' });
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const payments = await getUserPayments(
      String(userId),
      status || null,
      parseInt(limit),
      offset
    );

    return res.status(200).json({
      total: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        bookingId: p.booking_id,
        transactionId: p.transaction_id,
        amount: p.amount,
        status: p.status,
        paidAt: p.paid_at,
        bookingNumber: p.booking_number
      }))
    });

  } catch (err) {
    console.error('[Payments] getUserPaymentsList error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/payments
 * Get all payments (admin only)
 */
async function getAllPaymentsList(req, res) {
  const { status, fromDate, toDate, sortBy = 'paid_at', limit = 20, page = 1 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const payments = await getAllPayments(
      {
        status: status || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
        sortBy: sortBy || 'paid_at',
        order: 'DESC'
      },
      parseInt(limit),
      offset
    );

    const totalRevenue = await getTotalRevenue(fromDate || null, toDate || null);

    const formatted = payments.map(p => ({
      id: p.id,
      transactionId: p.transaction_id,
      bookingNumber: p.booking_number,
      guestName: `${p.firstName} ${p.lastName}`,
      amount: p.amount,
      status: p.status,
      paymentMethod: p.payment_method,
      paidAt: p.paid_at
    }));

    return res.status(200).json({
      total: payments.length,
      totalAmount: totalRevenue,
      page: parseInt(page),
      limit: parseInt(limit),
      payments: formatted
    });

  } catch (err) {
    console.error('[Payments] getAllPaymentsList error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/payments/:id
 * Get payment details (admin only)
 */
async function getAdminPaymentDetails(req, res) {
  const { id } = req.params;

  try {
    const payment = await findPaymentById(String(id));

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    return res.status(200).json({
      id: payment.id,
      transactionId: payment.transaction_id,
      bookingNumber: payment.booking_number,
      guest: {
        firstName: payment.firstName,
        lastName: payment.lastName,
        email: payment.email
      },
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.payment_method,
      paidAt: payment.paid_at,
      refundAmount: payment.refund_amount || 0
    });

  } catch (err) {
    console.error('[Payments] getAdminPaymentDetails error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * PUT /api/admin/payments/:id/status
 * Update payment status (admin only)
 */
async function updatePaymentStatusAdmin(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  try {
    const payment = await findPaymentById(String(id));

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    await updatePaymentStatus(String(id), status);

    return res.status(200).json({
      id: String(id),
      status,
      message: 'Payment status updated successfully'
    });

  } catch (err) {
    console.error('[Payments] updatePaymentStatusAdmin error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * POST /api/admin/payments/:id/refund
 * Process refund (admin only)
 */
async function processRefund(req, res) {
  const { id } = req.params;
  const { refundAmount } = req.body;

  if (!refundAmount || isNaN(refundAmount) || refundAmount <= 0) {
    return res.status(400).json({ message: 'Valid refund amount is required.' });
  }

  try {
    const payment = await findPaymentById(String(id));

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded.' });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed payment amount.' });
    }

    await createRefund(String(id), parseFloat(refundAmount));

    return res.status(200).json({
      id: String(id),
      status: 'refunded',
      refundAmount: parseFloat(refundAmount),
      message: 'Refund processed successfully'
    });

  } catch (err) {
    console.error('[Payments] processRefund error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/* ── Helper Functions ── */

/**
 * Generate mock transaction ID
 */
function generateTransactionId() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN-${timestamp}-${random}`;
}

/**
 * Validate mock card number (simple check for demo)
 */
function isValidMockCardNumber(cardNumber) {
  // Remove spaces and validate length
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  // Accept common test card numbers for demo
  const testCards = [
    '4111111111111111', // Visa
    '5555555555554444', // Mastercard
    '378282246310005',  // Amex
    '6011111111111117'  // Discover
  ];
  return testCards.includes(cleaned) || /^\d{13,19}$/.test(cleaned);
}

module.exports = {
  processMockPayment,
  verifyPayment,
  getPaymentDetails,
  getUserPaymentsList,
  getAllPaymentsList,
  getAdminPaymentDetails,
  updatePaymentStatusAdmin,
  processRefund
};
