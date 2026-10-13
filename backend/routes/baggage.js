const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// REQ-F33 & act2.pdf: Track Baggage by Tag Number or Booking ID (Public or Authenticated)
router.get('/track/:id', (req, res) => {
  const baggageTag = req.params.id.trim().toUpperCase();

  try {
    const baggage = db.get(`
      SELECT bg.*,
             b.booking_id, b.flight_id, b.seat_no,
             u.name AS passenger_name,
             f.departure, f.arrival, f.departure_time, f.status AS flight_status,
             al.airline_name
      FROM baggage bg
      JOIN bookings b ON bg.booking_id = b.booking_id
      JOIN users u ON b.passenger_id = u.id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN airlines al ON f.airline_id = al.airline_id
      WHERE bg.baggage_id = ? OR b.booking_id = ?
    `, [baggageTag, baggageTag]);

    if (!baggage) {
      return res.status(404).json({
        error: `Baggage tag '${baggageTag}' not found. Please verify the baggage tag number on your receipt.`
      });
    }

    // Generate full milestone timeline for visual tracking
    const allStatuses = ['Checked-In', 'Loaded', 'In-Transit', 'Delivered'];
    const currentIdx = allStatuses.indexOf(baggage.status);
    const milestones = allStatuses.map((st, idx) => ({
      status: st,
      completed: baggage.status === 'Lost' ? false : currentIdx >= idx,
      current: baggage.status === st
    }));

    res.json({
      baggage: {
        ...baggage,
        milestones,
        is_lost: baggage.status === 'Lost'
      }
    });
  } catch (err) {
    console.error('Baggage tracking error:', err);
    res.status(500).json({ error: 'Failed to retrieve baggage tracking data.' });
  }
});

// List all baggage (Ground Staff / Admin)
router.get('/', authenticateToken, authorizeRoles('Admin', 'Ground Staff', 'Airline Staff'), (req, res) => {
  try {
    const baggageList = db.query(`
      SELECT bg.*,
             b.flight_id, b.seat_no,
             u.name AS passenger_name,
             f.departure, f.arrival
      FROM baggage bg
      JOIN bookings b ON bg.booking_id = b.booking_id
      JOIN users u ON b.passenger_id = u.id
      JOIN flights f ON b.flight_id = f.flight_id
      ORDER BY bg.updated_at DESC
    `);
    res.json({ baggageList });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch baggage records.' });
  }
});

// REQ-F30: Register Baggage (Ground Staff & Admin)
router.post('/', authenticateToken, authorizeRoles('Admin', 'Ground Staff'), (req, res) => {
  const { booking_id, weight } = req.body;

  if (!booking_id || !weight) {
    return res.status(400).json({ error: 'Booking ID and baggage weight are required.' });
  }

  try {
    const booking = db.get('SELECT booking_id, passenger_id, flight_id FROM bookings WHERE booking_id = ?', [booking_id.trim().toUpperCase()]);
    if (!booking) {
      return res.status(404).json({ error: `Booking '${booking_id}' not found.` });
    }

    const baggageId = `BAG-${Math.floor(10000 + Math.random() * 90000)}`;

    db.transaction(() => {
      db.run(`
        INSERT INTO baggage (baggage_id, booking_id, weight, status)
        VALUES (?, ?, ?, 'Checked-In')
      `, [baggageId, booking_id.trim().toUpperCase(), Number(weight)]);

      db.run(`
        INSERT INTO notifications (user_id, message, type)
        VALUES (?, ?, 'INFO')
      `, [
        booking.passenger_id,
        `Baggage registered successfully with tag ${baggageId} (Weight: ${weight} kg) for flight ${booking.flight_id}.`
      ]);
    });

    res.status(201).json({
      message: 'Baggage registered successfully.',
      baggage_id: baggageId,
      booking_id: booking_id.trim().toUpperCase(),
      weight: Number(weight),
      status: 'Checked-In'
    });
  } catch (err) {
    console.error('Register baggage error:', err);
    res.status(500).json({ error: 'Failed to register baggage.' });
  }
});

// REQ-F31: Update Baggage Status (Ground Staff & Admin)
router.put('/:id/status', authenticateToken, authorizeRoles('Admin', 'Ground Staff'), (req, res) => {
  const baggageId = req.params.id.trim().toUpperCase();
  const { status } = req.body;

  const validStatuses = ['Checked-In', 'Loaded', 'In-Transit', 'Delivered', 'Lost'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const baggage = db.get(`
      SELECT bg.*, b.passenger_id, b.flight_id
      FROM baggage bg
      JOIN bookings b ON bg.booking_id = b.booking_id
      WHERE bg.baggage_id = ?
    `, [baggageId]);

    if (!baggage) {
      return res.status(404).json({ error: `Baggage '${baggageId}' not found.` });
    }

    db.transaction(() => {
      db.run(`
        UPDATE baggage
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE baggage_id = ?
      `, [status, baggageId]);

      // Notify passenger
      db.run(`
        INSERT INTO notifications (user_id, message, type)
        VALUES (?, ?, ?)
      `, [
        baggage.passenger_id,
        `Baggage Update (${baggageId}): Status is now '${status}'.`,
        status === 'Lost' ? 'ALERT' : 'INFO'
      ]);
    });

    res.json({ message: `Baggage ${baggageId} status updated to '${status}'.` });
  } catch (err) {
    console.error('Update baggage status error:', err);
    res.status(500).json({ error: 'Failed to update baggage status.' });
  }
});

// REQ-F32: File Lost Baggage Report (Passenger or Ground Staff)
router.post('/:id/incident', authenticateToken, (req, res) => {
  const baggageId = req.params.id.trim().toUpperCase();
  const { incident_report } = req.body;

  if (!incident_report) {
    return res.status(400).json({ error: 'Incident details are required to file report.' });
  }

  try {
    const baggage = db.get(`
      SELECT bg.*, b.passenger_id, b.flight_id
      FROM baggage bg
      JOIN bookings b ON bg.booking_id = b.booking_id
      WHERE bg.baggage_id = ?
    `, [baggageId]);

    if (!baggage) {
      return res.status(404).json({ error: `Baggage '${baggageId}' not found.` });
    }

    if (req.user.role === 'Passenger' && baggage.passenger_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to file report for this baggage.' });
    }

    db.transaction(() => {
      db.run(`
        UPDATE baggage
        SET status = 'Lost', incident_report = ?, updated_at = CURRENT_TIMESTAMP
        WHERE baggage_id = ?
      `, [incident_report, baggageId]);

      db.run(`
        INSERT INTO notifications (user_id, message, type)
        VALUES (?, ?, 'ALERT')
      `, [
        baggage.passenger_id,
        `Lost baggage incident logged for tag ${baggageId}. Ground operations team has been notified.`
      ]);
    });

    res.json({ message: 'Lost baggage incident report filed successfully. Ground team alerted.' });
  } catch (err) {
    console.error('Baggage report error:', err);
    res.status(500).json({ error: 'Failed to submit incident report.' });
  }
});

module.exports = router;
