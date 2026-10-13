const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// REQ-F39, REQ-F40, REQ-F41: Analytics Dashboard metrics & chart aggregations
router.get('/', authenticateToken, authorizeRoles('Admin', 'Airline Staff'), (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let dateFilterSql = '';
    const dateParams = [];

    if (startDate && endDate) {
      dateFilterSql = ' AND date(departure_time) BETWEEN date(?) AND date(?)';
      dateParams.push(startDate, endDate);
    } else if (startDate) {
      dateFilterSql = ' AND date(departure_time) >= date(?)';
      dateParams.push(startDate);
    } else if (endDate) {
      dateFilterSql = ' AND date(departure_time) <= date(?)';
      dateParams.push(endDate);
    }

    // 1. Total Flights
    const totalFlightsRow = db.get(`SELECT COUNT(*) as count FROM flights WHERE 1=1 ${dateFilterSql}`, dateParams);
    const totalFlights = totalFlightsRow.count;

    // 2. Delayed Flights
    const delayedFlightsRow = db.get(`SELECT COUNT(*) as count FROM flights WHERE status = 'Delayed' ${dateFilterSql}`, dateParams);
    const delayedFlights = delayedFlightsRow.count;

    // 3. Active Passengers (Passengers with Confirmed Bookings)
    const activePassengersRow = db.get(`
      SELECT COUNT(DISTINCT b.passenger_id) as count
      FROM bookings b
      JOIN flights f ON b.flight_id = f.flight_id
      WHERE b.booking_status = 'Confirmed' ${dateFilterSql}
    `, dateParams);
    const activePassengers = activePassengersRow.count;

    // 4. Total Revenue (Sum of successful payments)
    const totalRevenueRow = db.get(`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN flights f ON b.flight_id = f.flight_id
      WHERE p.payment_status = 'Success' ${dateFilterSql}
    `, dateParams);
    const totalRevenue = Number(totalRevenueRow.total);

    // 5. Available Gates
    const availableGatesRow = db.get("SELECT COUNT(*) as count FROM gates WHERE status = 'Available'");
    const totalGatesRow = db.get('SELECT COUNT(*) as count FROM gates');
    const availableGates = availableGatesRow.count;
    const totalGates = totalGatesRow.count;

    // 6. Chart: Flights by Status
    const statusDistribution = db.query(`
      SELECT status, COUNT(*) as count
      FROM flights
      WHERE 1=1 ${dateFilterSql}
      GROUP BY status
    `, dateParams);

    // 7. Chart: Flights by Airline
    const airlineDistribution = db.query(`
      SELECT al.airline_name, al.code, COUNT(f.flight_id) as count
      FROM airlines al
      LEFT JOIN flights f ON al.airline_id = f.airline_id ${dateFilterSql}
      GROUP BY al.airline_id
    `, dateParams);

    // 8. Chart: Bookings & Revenue timeline (Last 7 days or per date)
    const bookingTrends = db.query(`
      SELECT date(booking_date) as date,
             COUNT(*) as bookings,
             SUM(CASE WHEN b.booking_status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed,
             (SELECT COALESCE(SUM(amount), 0) FROM payments pm WHERE pm.booking_id IN (SELECT booking_id FROM bookings WHERE date(booking_date) = date(b.booking_date) AND booking_status = 'Confirmed')) as daily_revenue
      FROM bookings b
      GROUP BY date(booking_date)
      ORDER BY date(booking_date) DESC
      LIMIT 7
    `);

    // 9. Baggage Status overview
    const baggageOverview = db.query(`
      SELECT status, COUNT(*) as count
      FROM baggage
      GROUP BY status
    `);

    res.json({
      metrics: {
        totalFlights,
        delayedFlights,
        activePassengers,
        totalRevenue,
        availableGates,
        totalGates,
        gateUtilizationPct: totalGates > 0 ? Math.round(((totalGates - availableGates) / totalGates) * 100) : 0
      },
      charts: {
        statusDistribution,
        airlineDistribution,
        bookingTrends: bookingTrends.reverse(),
        baggageOverview
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to generate dashboard metrics.' });
  }
});

module.exports = router;
