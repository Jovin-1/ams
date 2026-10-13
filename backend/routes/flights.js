const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// REQ-F11: Search / list flights with filters (Public / Authenticated)
router.get('/', (req, res) => {
  try {
    const { origin, destination, date, airline_id, status } = req.query;

    let sql = `
      SELECT f.*,
             al.airline_name, al.code AS airline_code,
             ac.model AS aircraft_model, ac.capacity AS aircraft_capacity,
             g.gate_number,
             (SELECT COUNT(*) FROM bookings b WHERE b.flight_id = f.flight_id AND b.booking_status = 'Confirmed') AS booked_seats
      FROM flights f
      JOIN airlines al ON f.airline_id = al.airline_id
      JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      WHERE 1=1
    `;
    const params = [];

    if (origin) {
      sql += ` AND f.departure LIKE ?`;
      params.push(`%${origin.trim()}%`);
    }

    if (destination) {
      sql += ` AND f.arrival LIKE ?`;
      params.push(`%${destination.trim()}%`);
    }

    if (date) {
      sql += ` AND date(f.departure_time) = date(?)`;
      params.push(date.trim());
    }

    if (airline_id) {
      sql += ` AND f.airline_id = ?`;
      params.push(Number(airline_id));
    }

    if (status) {
      sql += ` AND f.status = ?`;
      params.push(status.trim());
    }

    sql += ` ORDER BY f.departure_time ASC`;

    const flights = db.query(sql, params).map(flight => ({
      ...flight,
      available_seats: flight.aircraft_capacity - flight.booked_seats
    }));

    res.json({ flights, count: flights.length });
  } catch (err) {
    console.error('Fetch flights error:', err);
    res.status(500).json({ error: 'Failed to retrieve flight records.' });
  }
});

// Single flight details
router.get('/:id', (req, res) => {
  try {
    const flight = db.get(`
      SELECT f.*,
             al.airline_name, al.code AS airline_code,
             ac.model AS aircraft_model, ac.capacity AS aircraft_capacity,
             g.gate_number, g.status AS gate_status,
             (SELECT COUNT(*) FROM bookings b WHERE b.flight_id = f.flight_id AND b.booking_status = 'Confirmed') AS booked_seats
      FROM flights f
      JOIN airlines al ON f.airline_id = al.airline_id
      JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      WHERE f.flight_id = ?
    `, [req.params.id]);

    if (!flight) {
      return res.status(404).json({ error: `Flight '${req.params.id}' not found.` });
    }

    flight.available_seats = flight.aircraft_capacity - flight.booked_seats;
    res.json({ flight });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve flight details.' });
  }
});

// REQ-F08, REQ-F12, REQ-F13: Create Flight (Admin & Airline Staff)
router.post('/', authenticateToken, authorizeRoles('Admin', 'Airline Staff'), (req, res) => {
  const {
    flight_id,
    airline_id,
    aircraft_id,
    departure,
    arrival,
    departure_time,
    arrival_time,
    price = 150.00,
    gate_id = null
  } = req.body;

  if (!flight_id || !airline_id || !aircraft_id || !departure || !arrival || !departure_time || !arrival_time) {
    return res.status(400).json({ error: 'All flight schedule parameters are mandatory.' });
  }

  // REQ-F13: Validate arrival time is later than departure time
  const depDate = new Date(departure_time);
  const arrDate = new Date(arrival_time);
  if (arrDate <= depDate) {
    return res.status(400).json({ error: 'Invalid schedule: Arrival time must be later than departure time.' });
  }

  try {
    // Check flight_id uniqueness
    const existing = db.get('SELECT flight_id FROM flights WHERE flight_id = ?', [flight_id.trim().toUpperCase()]);
    if (existing) {
      return res.status(409).json({ error: `Flight ID '${flight_id}' already exists.` });
    }

    // REQ-F12: Prevent aircraft double-scheduling (overlapping flight intervals for the same aircraft)
    const overlap = db.get(`
      SELECT flight_id FROM flights
      WHERE aircraft_id = ?
        AND status NOT IN ('Cancelled', 'Arrived')
        AND (
          (departure_time <= ? AND arrival_time >= ?) OR
          (departure_time <= ? AND arrival_time >= ?) OR
          (departure_time >= ? AND arrival_time <= ?)
        )
    `, [aircraft_id, departure_time, departure_time, arrival_time, arrival_time, departure_time, arrival_time]);

    if (overlap) {
      return res.status(409).json({
        error: `Aircraft conflict: Aircraft #${aircraft_id} is already scheduled for flight ${overlap.flight_id} during overlapping hours.`
      });
    }

    db.run(`
      INSERT INTO flights (flight_id, airline_id, aircraft_id, departure, arrival, departure_time, arrival_time, status, gate_id, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?, ?)
    `, [
      flight_id.trim().toUpperCase(),
      Number(airline_id),
      Number(aircraft_id),
      departure.trim(),
      arrival.trim(),
      departure_time,
      arrival_time,
      gate_id ? Number(gate_id) : null,
      Number(price)
    ]);

    res.status(201).json({ message: 'Flight scheduled successfully.', flight_id: flight_id.trim().toUpperCase() });
  } catch (err) {
    console.error('Create flight error:', err);
    res.status(500).json({ error: 'Failed to schedule new flight.' });
  }
});

// REQ-F09: Update Flight schedule, aircraft, or status (Admin & Airline Staff)
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Airline Staff'), (req, res) => {
  const flightId = req.params.id;
  const {
    departure_time,
    arrival_time,
    aircraft_id,
    gate_id,
    status,
    delay_reason,
    price
  } = req.body;

  try {
    const flight = db.get('SELECT * FROM flights WHERE flight_id = ?', [flightId]);
    if (!flight) {
      return res.status(404).json({ error: `Flight '${flightId}' not found.` });
    }

    const newDep = departure_time || flight.departure_time;
    const newArr = arrival_time || flight.arrival_time;
    const newAircraft = aircraft_id ? Number(aircraft_id) : flight.aircraft_id;
    const newStatus = status || flight.status;

    // REQ-F13: Time validation
    if (new Date(newArr) <= new Date(newDep)) {
      return res.status(400).json({ error: 'Arrival time must be later than departure time.' });
    }

    // REQ-F12: Overlap check if time or aircraft changed
    if (aircraft_id || departure_time || arrival_time) {
      const overlap = db.get(`
        SELECT flight_id FROM flights
        WHERE aircraft_id = ?
          AND flight_id != ?
          AND status NOT IN ('Cancelled', 'Arrived')
          AND (
            (departure_time <= ? AND arrival_time >= ?) OR
            (departure_time <= ? AND arrival_time >= ?) OR
            (departure_time >= ? AND arrival_time <= ?)
          )
      `, [newAircraft, flightId, newDep, newDep, newArr, newArr, newDep, newArr]);

      if (overlap) {
        return res.status(409).json({
          error: `Aircraft conflict with existing flight ${overlap.flight_id}.`
        });
      }
    }

    db.run(`
      UPDATE flights
      SET departure_time = ?, arrival_time = ?, aircraft_id = ?,
          gate_id = ?, status = ?, delay_reason = ?, price = COALESCE(?, price)
      WHERE flight_id = ?
    `, [
      newDep,
      newArr,
      newAircraft,
      gate_id !== undefined ? (gate_id ? Number(gate_id) : null) : flight.gate_id,
      newStatus,
      delay_reason !== undefined ? delay_reason : flight.delay_reason,
      price ? Number(price) : null,
      flightId
    ]);

    // REQ-F24: Passenger notification when flight status or delay changes
    if (newStatus !== flight.status || delay_reason) {
      const bookedUsers = db.query(`
        SELECT p.passenger_id
        FROM bookings b
        JOIN passengers p ON b.passenger_id = p.passenger_id
        WHERE b.flight_id = ? AND b.booking_status = 'Confirmed'
      `, [flightId]);

      const msg = `Flight ${flightId} status update: ${newStatus}${delay_reason ? ` (Reason: ${delay_reason})` : ''}. Departure: ${newDep}`;
      const notifType = newStatus === 'Delayed' || newStatus === 'Cancelled' ? 'ALERT' : 'INFO';

      for (const u of bookedUsers) {
        db.run('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)', [
          u.passenger_id, msg, notifType
        ]);
      }
    }

    res.json({ message: `Flight ${flightId} updated successfully.` });
  } catch (err) {
    console.error('Update flight error:', err);
    res.status(500).json({ error: 'Failed to update flight.' });
  }
});

// REQ-F10 & REQ-NF05: Delete flight only if no active (non-cancelled) bookings exist
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const flightId = req.params.id;

  try {
    const activeBooking = db.get(`
      SELECT booking_id FROM bookings
      WHERE flight_id = ? AND booking_status = 'Confirmed'
    `, [flightId]);

    if (activeBooking) {
      return res.status(409).json({
        error: `Safety constraint violation (REQ-NF05): Cannot delete flight ${flightId} because active passenger bookings are associated with it. Cancel bookings first or mark flight as Cancelled.`
      });
    }

    db.run('DELETE FROM flights WHERE flight_id = ?', [flightId]);
    res.json({ message: `Flight ${flightId} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete flight.' });
  }
});

// Passenger manifest for airline staff
router.get('/:id/manifest', authenticateToken, authorizeRoles('Admin', 'Airline Staff', 'Ground Staff'), (req, res) => {
  try {
    const passengers = db.query(`
      SELECT b.booking_id, b.seat_no, b.booking_status,
             u.name, u.email, p.passport_no, p.phone,
             bp.pass_id, bp.gate, bp.boarding_time,
             bg.baggage_id, bg.weight AS baggage_weight, bg.status AS baggage_status
      FROM bookings b
      JOIN passengers p ON b.passenger_id = p.passenger_id
      JOIN users u ON p.passenger_id = u.id
      LEFT JOIN boarding_passes bp ON b.booking_id = bp.booking_id
      LEFT JOIN baggage bg ON b.booking_id = bg.booking_id
      WHERE b.flight_id = ?
      ORDER BY b.seat_no ASC
    `, [req.params.id]);

    res.json({ flight_id: req.params.id, manifest: passengers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flight manifest.' });
  }
});

module.exports = router;
