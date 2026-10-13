const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// List all gates with airport details
router.get('/', (req, res) => {
  try {
    const gates = db.query(`
      SELECT g.*, a.airport_name, a.city, a.country, a.code AS airport_code,
             (SELECT f.flight_id FROM flights f WHERE f.gate_id = g.gate_id AND f.status IN ('Scheduled', 'Boarding') LIMIT 1) AS current_flight
      FROM gates g
      JOIN airports a ON g.airport_id = a.airport_id
      ORDER BY a.code, g.gate_number
    `);
    res.json({ gates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve gates.' });
  }
});

// REQ-F38: Smart Gate Assignment suggestion algorithm
// Suggests best gate based on airport, aircraft capacity, and current conflict-free schedule
router.get('/smart-assign/:flight_id', authenticateToken, authorizeRoles('Admin', 'Ground Staff', 'Airline Staff'), (req, res) => {
  const flightId = req.params.flight_id;

  try {
    const flight = db.get(`
      SELECT f.*, ac.capacity, ac.model, al.airline_name
      FROM flights f
      JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      JOIN airlines al ON f.airline_id = al.airline_id
      WHERE f.flight_id = ?
    `, [flightId]);

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found.' });
    }

    // Determine destination or origin airport match (assuming origin airport gate assignment)
    // Find gates at that airport
    const allGates = db.query(`
      SELECT g.*, a.airport_name, a.code AS airport_code
      FROM gates g
      JOIN airports a ON g.airport_id = a.airport_id
      WHERE g.status != 'Under Maintenance'
    `);

    // Check conflict for each gate
    const suitableGates = allGates.map(gate => {
      const conflict = db.get(`
        SELECT flight_id, departure_time, arrival_time FROM flights
        WHERE gate_id = ?
          AND flight_id != ?
          AND status IN ('Scheduled', 'Boarding', 'Delayed')
          AND (
            (departure_time <= ? AND arrival_time >= ?) OR
            (departure_time <= ? AND arrival_time >= ?) OR
            (departure_time >= ? AND arrival_time <= ?)
          )
      `, [gate.gate_id, flightId, flight.departure_time, flight.departure_time, flight.arrival_time, flight.arrival_time, flight.departure_time, flight.arrival_time]);

      const isCompatibleSize = flight.capacity > 250 ? gate.gate_number.includes('A') || gate.gate_number.includes('1') : true;

      return {
        ...gate,
        is_available: !conflict,
        conflict_flight: conflict ? conflict.flight_id : null,
        compatibility_score: isCompatibleSize && !conflict ? 95 : (!conflict ? 80 : 20),
        recommendation: !conflict
          ? (isCompatibleSize ? 'Highly Recommended (Wide-body capacity)' : 'Available (Standard)')
          : 'Occupied during this flight slot'
      };
    });

    suitableGates.sort((a, b) => b.compatibility_score - a.compatibility_score);

    res.json({
      flight_id: flightId,
      flight_aircraft: flight.model,
      capacity: flight.capacity,
      recommended_gate: suitableGates.find(g => g.is_available) || null,
      all_candidates: suitableGates
    });
  } catch (err) {
    console.error('Smart assign error:', err);
    res.status(500).json({ error: 'Smart gate assignment failed.' });
  }
});

// REQ-F34, REQ-F35: Assign Gate to Flight with Conflict Prevention
router.post('/assign', authenticateToken, authorizeRoles('Admin', 'Ground Staff'), (req, res) => {
  const { flight_id, gate_id } = req.body;

  if (!flight_id || !gate_id) {
    return res.status(400).json({ error: 'Flight ID and Gate ID are required.' });
  }

  try {
    const flight = db.get('SELECT * FROM flights WHERE flight_id = ?', [flight_id]);
    if (!flight) {
      return res.status(404).json({ error: `Flight '${flight_id}' not found.` });
    }

    const gate = db.get('SELECT * FROM gates WHERE gate_id = ?', [Number(gate_id)]);
    if (!gate) {
      return res.status(404).json({ error: `Gate ID #${gate_id} not found.` });
    }

    if (gate.status === 'Under Maintenance') {
      return res.status(400).json({ error: `Gate ${gate.gate_number} is currently Under Maintenance and cannot be assigned.` });
    }

    // REQ-F35: Prevent assigning already-occupied gate to conflicting flight at overlapping time
    const conflict = db.get(`
      SELECT flight_id, departure_time, arrival_time FROM flights
      WHERE gate_id = ?
        AND flight_id != ?
        AND status IN ('Scheduled', 'Boarding', 'Delayed')
        AND (
          (departure_time <= ? AND arrival_time >= ?) OR
          (departure_time <= ? AND arrival_time >= ?) OR
          (departure_time >= ? AND arrival_time <= ?)
        )
    `, [Number(gate_id), flight_id, flight.departure_time, flight.departure_time, flight.arrival_time, flight.arrival_time, flight.departure_time, flight.arrival_time]);

    if (conflict) {
      return res.status(409).json({
        error: `Gate Conflict (REQ-F35): Gate ${gate.gate_number} is already reserved for flight ${conflict.flight_id} during overlapping hours.`
      });
    }

    db.transaction(() => {
      // Assign gate to flight
      db.run('UPDATE flights SET gate_id = ? WHERE flight_id = ?', [Number(gate_id), flight_id]);

      // Update gate status to Occupied if flight is boarding/scheduled
      db.run("UPDATE gates SET status = 'Occupied' WHERE gate_id = ?", [Number(gate_id)]);

      // If boarding passes exist for this flight, update their gate
      db.run(`
        UPDATE boarding_passes
        SET gate = ?
        WHERE booking_id IN (SELECT booking_id FROM bookings WHERE flight_id = ?)
      `, [gate.gate_number, flight_id]);
    });

    res.json({
      message: `Gate ${gate.gate_number} successfully assigned to flight ${flight_id}.`,
      gate_number: gate.gate_number
    });
  } catch (err) {
    console.error('Assign gate error:', err);
    res.status(500).json({ error: 'Failed to assign gate.' });
  }
});

// Update Gate status (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const gateId = req.params.id;
  const { status, gate_number } = req.body;

  try {
    db.run(`
      UPDATE gates
      SET status = COALESCE(?, status),
          gate_number = COALESCE(?, gate_number)
      WHERE gate_id = ?
    `, [status, gate_number, gateId]);

    res.json({ message: 'Gate updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update gate.' });
  }
});

module.exports = router;
