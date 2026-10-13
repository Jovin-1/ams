const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// REQ-F14: Get real-time seat map and availability for a flight
router.get('/flight/:flight_id/seats', (req, res) => {
  const { flight_id } = req.params;

  try {
    const flight = db.get(`
      SELECT f.flight_id, f.departure, f.arrival, f.price, ac.capacity, ac.model
      FROM flights f
      JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      WHERE f.flight_id = ?
    `, [flight_id]);

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found.' });
    }

    // Get all booked seats for this flight that are Confirmed
    const bookedRecords = db.query(`
      SELECT seat_no FROM bookings
      WHERE flight_id = ? AND booking_status = 'Confirmed'
    `, [flight_id]);

    const bookedSeatSet = new Set(bookedRecords.map(b => b.seat_no));

    // Generate standard aircraft seating grid (e.g., Rows 1-30, A-F)
    const rows = Math.min(Math.ceil(flight.capacity / 6), 30);
    const seatColumns = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seats = [];

    for (let r = 1; r <= rows; r++) {
      const rowNum = r < 10 ? `0${r}` : `${r}`;
      for (const col of seatColumns) {
        if (seats.length < flight.capacity) {
          const seatId = `${rowNum}${col}`;
          const isWindow = col === 'A' || col === 'F';
          const isAisle = col === 'C' || col === 'D';
          const isMiddle = col === 'B' || col === 'E';
          seats.push({
            seat_no: seatId,
            row: r,
            col,
            type: isWindow ? 'Window' : isAisle ? 'Aisle' : 'Middle',
            is_available: !bookedSeatSet.has(seatId),
            price: flight.price + (isWindow ? 15 : isAisle ? 10 : 0)
          });
        }
      }
    }

    res.json({
      flight_id,
      capacity: flight.capacity,
      model: flight.model,
      total_booked: bookedRecords.length,
      available_count: flight.capacity - bookedRecords.length,
      seats
    });
  } catch (err) {
    console.error('Seats map error:', err);
    res.status(500).json({ error: 'Failed to retrieve seat availability.' });
  }
});

// REQ-F15, REQ-F16, REQ-F17, REQ-F18: Create Booking with Mock Payment Transaction
router.post('/book', authenticateToken, (req, res) => {
  const passengerId = req.user.id;
  const { flight_id, seat_no, payment_method = 'Credit Card (Mock)', amount, baggage_weight } = req.body;

  if (!flight_id || !seat_no) {
    return res.status(400).json({ error: 'Flight ID and Seat Number are required.' });
  }

  try {
    // Check flight exists and is not departed/cancelled
    const flight = db.get('SELECT * FROM flights WHERE flight_id = ?', [flight_id]);
    if (!flight) {
      return res.status(404).json({ error: `Flight ${flight_id} not found.` });
    }
    if (['Cancelled', 'Departed', 'Arrived'].includes(flight.status)) {
      return res.status(400).json({ error: `Cannot book: Flight status is '${flight.status}'.` });
    }

    // Ensure passenger record exists
    let passenger = db.get('SELECT passenger_id FROM passengers WHERE passenger_id = ?', [passengerId]);
    if (!passenger) {
      db.run('INSERT INTO passengers (passenger_id, passport_no, phone) VALUES (?, ?, ?)', [passengerId, '', '']);
    }

    // REQ-F18: Prevent double booking of same seat on same flight
    const existingSeat = db.get(`
      SELECT booking_id FROM bookings
      WHERE flight_id = ? AND seat_no = ? AND booking_status = 'Confirmed'
    `, [flight_id, seat_no]);

    if (existingSeat) {
      return res.status(409).json({
        error: `Seat ${seat_no} on flight ${flight_id} has already been reserved by another passenger.`
      });
    }

    const bookingId = `BK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const paymentId = `PAY-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const finalAmount = Number(amount || flight.price);

    // REQ-NF13: Atomic transaction: Payment must succeed for booking to be confirmed
    db.transaction(() => {
      // 1. Insert Booking record
      db.run(`
        INSERT INTO bookings (booking_id, passenger_id, flight_id, seat_no, booking_status)
        VALUES (?, ?, ?, ?, 'Confirmed')
      `, [bookingId, passengerId, flight_id, seat_no]);

      // 2. Insert Payment record (REQ-F16)
      db.run(`
        INSERT INTO payments (payment_id, booking_id, amount, payment_status, payment_method, transaction_id)
        VALUES (?, ?, ?, 'Success', ?, ?)
      `, [
        paymentId,
        bookingId,
        finalAmount,
        payment_method,
        `TXN-AMS-${Math.floor(10000000 + Math.random() * 90000000)}`
      ]);

      // 3. Optional initial baggage registration if specified
      if (baggage_weight && Number(baggage_weight) > 0) {
        const bagId = `BAG-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
        db.run(`
          INSERT INTO baggage (baggage_id, booking_id, weight, status)
          VALUES (?, ?, ?, 'Checked-In')
        `, [bagId, bookingId, Number(baggage_weight)]);
      }

      // 4. Passenger notification
      db.run(`
        INSERT INTO notifications (user_id, message, type)
        VALUES (?, ?, 'INFO')
      `, [
        passengerId,
        `Booking ${bookingId} confirmed for flight ${flight_id} (Seat: ${seat_no}). Payment of $${finalAmount.toFixed(2)} successful.`
      ]);
    });

    res.status(201).json({
      message: 'Booking and mock payment confirmed successfully!',
      booking: {
        booking_id: bookingId,
        flight_id,
        seat_no,
        amount: finalAmount,
        payment_id: paymentId,
        status: 'Confirmed'
      }
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: err.message || 'Transaction failed. Booking could not be completed.' });
  }
});

// REQ-F20: Passenger's booking history
router.get('/my-bookings', authenticateToken, (req, res) => {
  const passengerId = req.user.id;

  try {
    const bookings = db.query(`
      SELECT b.booking_id, b.seat_no, b.booking_status, b.booking_date,
             f.flight_id, f.departure, f.arrival, f.departure_time, f.arrival_time, f.status AS flight_status, f.delay_reason,
             al.airline_name, al.code AS airline_code,
             p.amount, p.payment_status, p.payment_id,
             bp.pass_id, bp.gate, bp.boarding_time,
             bg.baggage_id, bg.weight AS baggage_weight, bg.status AS baggage_status
      FROM bookings b
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN airlines al ON f.airline_id = al.airline_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      LEFT JOIN boarding_passes bp ON b.booking_id = bp.booking_id
      LEFT JOIN baggage bg ON b.booking_id = bg.booking_id
      WHERE b.passenger_id = ?
      ORDER BY b.booking_date DESC
    `, [passengerId]);

    res.json({ bookings });
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch booking history.' });
  }
});

// Single booking details (SRS Section 6.2: GET /booking/:id)
router.get('/booking/:id', authenticateToken, (req, res) => {
  try {
    const booking = db.get(`
      SELECT b.booking_id, b.passenger_id, b.seat_no, b.booking_status, b.booking_date,
             u.name AS passenger_name, u.email AS passenger_email,
             ps.passport_no, ps.phone,
             f.flight_id, f.departure, f.arrival, f.departure_time, f.arrival_time, f.status AS flight_status, f.delay_reason,
             al.airline_name, al.code AS airline_code,
             ac.model AS aircraft_model,
             p.payment_id, p.amount, p.payment_status, p.payment_method, p.transaction_id,
             bp.pass_id, bp.gate, bp.boarding_time, bp.qr_code,
             bg.baggage_id, bg.weight AS baggage_weight, bg.status AS baggage_status, bg.incident_report
      FROM bookings b
      JOIN users u ON b.passenger_id = u.id
      LEFT JOIN passengers ps ON b.passenger_id = ps.passenger_id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN airlines al ON f.airline_id = al.airline_id
      JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      LEFT JOIN boarding_passes bp ON b.booking_id = bp.booking_id
      LEFT JOIN baggage bg ON b.booking_id = bg.booking_id
      WHERE b.booking_id = ?
    `, [req.params.id]);

    if (!booking) {
      return res.status(404).json({ error: `Booking '${req.params.id}' not found.` });
    }

    // Role check: Only the owning passenger, admin, airline staff, or ground staff can view
    if (req.user.role === 'Passenger' && booking.passenger_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this booking.' });
    }

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve booking.' });
  }
});

// REQ-F19: Cancel Booking prior to cutoff time (SRS Section 6.2: DELETE /booking/:id)
router.delete('/booking/:id', authenticateToken, (req, res) => {
  const bookingId = req.params.id;

  try {
    const booking = db.get(`
      SELECT b.*, f.departure_time, f.flight_id, f.status AS flight_status
      FROM bookings b
      JOIN flights f ON b.flight_id = f.flight_id
      WHERE b.booking_id = ?
    `, [bookingId]);

    if (!booking) {
      return res.status(404).json({ error: `Booking '${bookingId}' not found.` });
    }

    if (req.user.role === 'Passenger' && booking.passenger_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking.' });
    }

    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({ error: 'This booking is already cancelled.' });
    }

    // Cutoff time check (2 hours before departure per TBD-02)
    const depTime = new Date(booking.departure_time).getTime();
    const nowTime = Date.now();
    const hoursRemaining = (depTime - nowTime) / (1000 * 3600);

    // If less than 2 hours before departure, passengers cannot cancel online
    if (req.user.role === 'Passenger' && hoursRemaining < 2 && hoursRemaining > 0) {
      return res.status(400).json({
        error: 'Cancellation deadline passed: Bookings cannot be cancelled less than 2 hours before departure. Please contact Airline Staff.'
      });
    }

    // Update status to 'Cancelled' and simulate refund
    db.transaction(() => {
      db.run("UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?", [bookingId]);

      // Update payment record to reflect refund
      db.run("UPDATE payments SET payment_status = 'Refunded' WHERE booking_id = ?", [bookingId]);

      // Update boarding pass if exists
      db.run("DELETE FROM boarding_passes WHERE booking_id = ?", [bookingId]);

      // Notification
      db.run(`
        INSERT INTO notifications (user_id, message, type)
        VALUES (?, ?, 'WARNING')
      `, [
        booking.passenger_id,
        `Booking ${bookingId} has been cancelled. Seat ${booking.seat_no} has been released and a mock refund has been processed.`
      ]);
    });

    res.json({
      message: `Booking ${bookingId} has been successfully cancelled and seat ${booking.seat_no} released. Mock refund processed.`
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
});

module.exports = router;
