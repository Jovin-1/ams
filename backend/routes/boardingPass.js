const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// REQ-F36 & REQ-F37: Check In Passenger & Generate Boarding Pass
router.post('/checkin', authenticateToken, (req, res) => {
  const { booking_id, qr_code_scan } = req.body;
  const targetBookingId = (booking_id || qr_code_scan || '').trim().toUpperCase();

  if (!targetBookingId) {
    return res.status(400).json({ error: 'Valid Booking ID or QR code data is required for check-in.' });
  }

  try {
    const booking = db.get(`
      SELECT b.*, f.departure_time, f.arrival_time, f.departure, f.arrival, f.status AS flight_status, f.gate_id,
             g.gate_number, al.airline_name, al.code AS airline_code,
             u.name AS passenger_name, p.passport_no
      FROM bookings b
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN airlines al ON f.airline_id = al.airline_id
      JOIN users u ON b.passenger_id = u.id
      LEFT JOIN passengers p ON b.passenger_id = p.passenger_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      WHERE b.booking_id = ?
    `, [targetBookingId]);

    if (!booking) {
      return res.status(404).json({ error: `Booking '${targetBookingId}' not found in database.` });
    }

    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot check in: Booking '${targetBookingId}' has been cancelled.` });
    }

    if (req.user.role === 'Passenger' && booking.passenger_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only check in your own booking.' });
    }

    // Check if boarding pass already exists
    let existingPass = db.get('SELECT * FROM boarding_passes WHERE booking_id = ?', [targetBookingId]);
    if (existingPass) {
      return res.json({
        message: 'Passenger has already checked in! Returning issued boarding pass.',
        boardingPass: {
          ...existingPass,
          flight_id: booking.flight_id,
          passenger_name: booking.passenger_name,
          departure: booking.departure,
          arrival: booking.arrival,
          departure_time: booking.departure_time,
          seat_no: booking.seat_no,
          airline_name: booking.airline_name
        }
      });
    }

    const depTime = new Date(booking.departure_time);
    const boardingTime = new Date(depTime.getTime() - 45 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const assignedGate = booking.gate_number || 'Gate TBD';
    const passId = `BP-${Math.floor(10000 + Math.random() * 90000)}`;
    const qrPayload = `AMS|${passId}|${targetBookingId}|${booking.flight_id}|${booking.seat_no}|${assignedGate}`;

    db.transaction(() => {
      db.run(`
        INSERT INTO boarding_passes (pass_id, booking_id, gate, boarding_time, qr_code)
        VALUES (?, ?, ?, ?, ?)
      `, [passId, targetBookingId, assignedGate, boardingTime, qrPayload]);

      db.run(`
        INSERT INTO notifications (user_id, message, type)
        VALUES (?, ?, 'INFO')
      `, [
        booking.passenger_id,
        `Check-in verified! Boarding Pass ${passId} issued for Flight ${booking.flight_id} (Seat: ${booking.seat_no}, Gate: ${assignedGate}).`
      ]);
    });

    res.status(201).json({
      message: 'Check-in successful! Boarding pass generated.',
      boardingPass: {
        pass_id: passId,
        booking_id: targetBookingId,
        flight_id: booking.flight_id,
        passenger_name: booking.passenger_name,
        seat_no: booking.seat_no,
        departure: booking.departure,
        arrival: booking.arrival,
        departure_time: booking.departure_time,
        boarding_time: boardingTime,
        gate: assignedGate,
        airline_name: booking.airline_name,
        qr_code: qrPayload
      }
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Check-in failed due to server error.' });
  }
});

// REQ-F22 & act3.pdf: Retrieve Boarding Pass by Booking ID or Pass ID
router.get('/boarding-pass/:id', authenticateToken, (req, res) => {
  const param = req.params.id.trim().toUpperCase();

  try {
    const pass = db.get(`
      SELECT bp.*,
             b.seat_no, b.passenger_id, b.flight_id, b.booking_status,
             u.name AS passenger_name, p.passport_no,
             f.departure, f.arrival, f.departure_time, f.arrival_time, f.status AS flight_status,
             al.airline_name, al.code AS airline_code,
             ac.model AS aircraft_model
      FROM boarding_passes bp
      JOIN bookings b ON bp.booking_id = b.booking_id
      JOIN users u ON b.passenger_id = u.id
      LEFT JOIN passengers p ON b.passenger_id = p.passenger_id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN airlines al ON f.airline_id = al.airline_id
      JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      WHERE bp.pass_id = ? OR bp.booking_id = ?
    `, [param, param]);

    if (!pass) {
      return res.status(404).json({ error: `Boarding Pass not found for '${param}'. Passenger may not have checked in yet.` });
    }

    if (req.user.role === 'Passenger' && pass.passenger_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this boarding pass.' });
    }

    res.json({ boardingPass: pass });
  } catch (err) {
    console.error('Boarding pass error:', err);
    res.status(500).json({ error: 'Failed to retrieve boarding pass.' });
  }
});

module.exports = router;
