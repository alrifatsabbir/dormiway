/* ============================================================
   dashboard.controller.js — Admin dashboard & analytics
   ============================================================ */
'use strict';

const { getRevenueStats, getOccupancyRate, getUpcomingCheckIns, getBookingCount } = require('../models/booking.model');
const { getTotalRevenue, getPaymentCount } = require('../models/payment.model');
const { getRoomCount } = require('../models/room.model');
const { getGuestsCount } = require('../models/guest.model');

/**
 * GET /api/admin/dashboard/overview
 * Get dashboard statistics and KPIs (admin only)
 */
async function getDashboardOverview(req, res) {
  try {
    const { Booking } = require('../models/booking.model');
    const { Room } = require('../models/room.model');
    const today = new Date().toISOString().split('T')[0];

    const [
      totalBookings,
      totalRevenue,
      occupancyData,
      totalGuests,
      pendingPayments,
      totalRooms,
      availableRooms,
      todayCheckIns,
      todayCheckOuts,
    ] = await Promise.all([
      getBookingCount(),
      getTotalRevenue(),
      getOccupancyRate(),
      getGuestsCount(),
      getPaymentCount('pending'),
      Room.countDocuments(),
      getRoomCount(),
      Booking.countDocuments({ check_in_date: today, status: { $in: ['pending', 'confirmed', 'checked_in'] } }),
      Booking.countDocuments({ check_out_date: today, status: { $in: ['confirmed', 'checked_in', 'completed'] } }),
    ]);

    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = today;

    const monthRevenueStats = await getRevenueStats(monthStart, monthEnd);
    const thisMonthBookings = monthRevenueStats?.totalBookings || 0;
    const thisMonthRevenue = monthRevenueStats?.totalRevenue || 0;

    return res.status(200).json({
      totalBookings: totalBookings || 0,
      totalRevenue: totalRevenue || 0,
      occupancyRate: occupancyData?.occupancyPercent || 0,
      thisMonthBookings,
      thisMonthRevenue,
      thisMonthOccupancy: occupancyData?.occupancyPercent || 0,
      todayCheckIns: todayCheckIns || 0,
      todayCheckOuts: todayCheckOuts || 0,
      totalRooms: totalRooms || 0,
      availableRooms: availableRooms || 0,
      occupiedRooms: occupancyData?.occupiedRooms || 0,
      pendingPayments: pendingPayments || 0,
      totalGuests: totalGuests || 0,
    });

  } catch (err) {
    console.error('[Dashboard] getDashboardOverview error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/dashboard/revenue
 * Get revenue analytics (admin only)
 */
async function getRevenueAnalytics(req, res) {
  const { period = '30days', fromDate, toDate } = req.query;

  try {
    let from, to;

    /* ── Calculate date range based on period ── */
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (period === '7days') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      to = now;
    } else if (period === '30days') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      to = now;
    } else if (period === '90days') {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      to = now;
    } else if (period === '1year') {
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      to = now;
    } else if (period === 'custom') {
      from = new Date(fromDate);
      to = new Date(toDate);
    } else {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      to = now;
    }

    const revenueStats = await getRevenueStats(
      from.toISOString().split('T')[0],
      to.toISOString().split('T')[0]
    );

    const { Booking } = require('../models/booking.model');
    const grouped = await Booking.aggregate([
      {
        $match: {
          created_at: { $gte: from, $lte: to },
          status: { $in: ['confirmed', 'completed', 'checked_in'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          revenue: { $sum: '$total_price' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyData = grouped.map((g) => ({
      date: g._id,
      revenue: g.revenue,
      bookings: g.bookings,
    }));

    return res.status(200).json({
      period,
      totalRevenue: revenueStats?.totalRevenue || 0,
      totalBookings: revenueStats?.totalBookings || 0,
      averageBookingValue: revenueStats?.averageBookingValue || 0,
      dailyData
    });

  } catch (err) {
    console.error('[Dashboard] getRevenueAnalytics error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/dashboard/occupancy
 * Get occupancy statistics (admin only)
 */
async function getOccupancyStats(req, res) {
  try {
    const occupancyData = await getOccupancyRate();

    /* ── Mock room-level data ── */
    const byRoomType = {
      standard: 90,
      executive: 85,
      presidential: 75
    };

    const byRoom = [
      { roomId: 1, roomName: 'Standard Suite 1', occupancy: 92 },
      { roomId: 2, roomName: 'Standard Suite 2', occupancy: 88 },
      { roomId: 3, roomName: 'Executive Suite 1', occupancy: 85 },
      { roomId: 4, roomName: 'Presidential Suite', occupancy: 75 }
    ];

    return res.status(200).json({
      averageOccupancy: occupancyData?.occupancyPercent || 0,
      byRoomType,
      byRoom
    });

  } catch (err) {
    console.error('[Dashboard] getOccupancyStats error:', err.message);
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
    console.error('[Dashboard] getUpcomingCheckInsView error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/reports/summary
 * Get comprehensive report summary (admin only)
 */
async function getReportSummary(req, res) {
  const { fromDate, toDate } = req.query;

  try {
    const now = new Date();
    const from = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toDate ? new Date(toDate) : now;

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const revenueStats = await getRevenueStats(fromStr, toStr);
    const totalGuests = await getGuestsCount();

    return res.status(200).json({
      period: `${fromStr} to ${toStr}`,
      totalBookings: revenueStats?.totalBookings || 0,
      totalRevenue: revenueStats?.totalRevenue || 0,
      averageBookingValue: revenueStats?.averageBookingValue || 0,
      occupancyRate: 88, // Mock value
      totalGuests,
      repeatingGuests: 5, // Mock value
      cancellations: 2, // Mock value
      refunds: 100, // Mock value
      topRoomType: 'standard',
      topCountry: 'USA'
    });

  } catch (err) {
    console.error('[Dashboard] getReportSummary error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/reports/room-performance
 * Get per-room performance metrics (admin only)
 */
async function getRoomPerformance(req, res) {
  try {
    /* ── Mock room performance data ── */
    const rooms = [
      {
        roomId: 1,
        roomName: 'Standard Suite 1',
        type: 'standard',
        totalBookings: 12,
        totalRevenue: 7200,
        occupancyDays: 48,
        averageRating: 4.5,
        occupancyRate: 100
      },
      {
        roomId: 2,
        roomName: 'Standard Suite 2',
        type: 'standard',
        totalBookings: 10,
        totalRevenue: 6000,
        occupancyDays: 40,
        averageRating: 4.3,
        occupancyRate: 95
      },
      {
        roomId: 3,
        roomName: 'Executive Suite',
        type: 'executive',
        totalBookings: 8,
        totalRevenue: 8000,
        occupancyDays: 32,
        averageRating: 4.7,
        occupancyRate: 85
      },
      {
        roomId: 4,
        roomName: 'Presidential Suite',
        type: 'presidential',
        totalBookings: 5,
        totalRevenue: 7500,
        occupancyDays: 25,
        averageRating: 4.9,
        occupancyRate: 75
      }
    ];

    return res.status(200).json({
      rooms
    });

  } catch (err) {
    console.error('[Dashboard] getRoomPerformance error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * GET /api/admin/reports/guest-analysis
 * Get guest analytics (admin only)
 */
async function getGuestAnalysis(req, res) {
  try {
    const totalGuests = await getGuestsCount();

    /* ── Mock guest data ── */
    const guestData = {
      totalGuests,
      newGuestsThisMonth: 20,
      repeatingGuests: 35,
      returnRate: 23.3,
      topCountries: [
        { country: 'USA', count: 50 },
        { country: 'UK', count: 35 },
        { country: 'Canada', count: 28 },
        { country: 'Australia', count: 15 }
      ],
      averageStayLength: 3.2,
      guestSatisfaction: 4.6
    };

    return res.status(200).json(guestData);

  } catch (err) {
    console.error('[Dashboard] getGuestAnalysis error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  getDashboardOverview,
  getRevenueAnalytics,
  getOccupancyStats,
  getUpcomingCheckInsView,
  getReportSummary,
  getRoomPerformance,
  getGuestAnalysis
};
