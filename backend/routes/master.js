const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public or Authenticated lookup for dropdowns
router.get('/airlines', (req, res) => {
  const airlines = db.query('SELECT * FROM airlines ORDER BY airline_name');
  res.json({ airlines });
});

router.get('/airports', (req, res) => {
  const airports = db.query('SELECT * FROM airports ORDER BY city, airport_name');
  res.json({ airports });
});

router.get('/aircraft', (req, res) => {
  const aircraft = db.query(`
    SELECT ac.*, al.airline_name, al.code AS airline_code
    FROM aircraft ac
    JOIN airlines al ON ac.airline_id = al.airline_id
    ORDER BY ac.model
  `);
  res.json({ aircraft });
});

// Admin-only CRUD operations
// Airlines CRUD
router.post('/airlines', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const { airline_name, code } = req.body;
  if (!airline_name || !code) return res.status(400).json({ error: 'Name and code required.' });

  try {
    const resDb = db.run('INSERT INTO airlines (airline_name, code) VALUES (?, ?)', [airline_name.trim(), code.trim().toUpperCase()]);
    res.status(201).json({ message: 'Airline added.', airline_id: resDb.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/airlines/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const id = Number(req.params.id);
  const activeFlights = db.get('SELECT flight_id FROM flights WHERE airline_id = ? LIMIT 1', [id]);
  if (activeFlights) {
    return res.status(409).json({ error: 'Cannot delete airline: Dependent flights exist in the system (REQ-NF05).' });
  }
  db.run('DELETE FROM airlines WHERE airline_id = ?', [id]);
  res.json({ message: 'Airline removed.' });
});

// Airports CRUD
router.post('/airports', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const { airport_name, city, country, code } = req.body;
  if (!airport_name || !city || !country || !code) return res.status(400).json({ error: 'All airport fields required.' });

  try {
    const resDb = db.run('INSERT INTO airports (airport_name, city, country, code) VALUES (?, ?, ?, ?)', [
      airport_name.trim(), city.trim(), country.trim(), code.trim().toUpperCase()
    ]);
    res.status(201).json({ message: 'Airport added.', airport_id: resDb.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/airports/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const id = Number(req.params.id);
  const hasGates = db.get('SELECT gate_id FROM gates WHERE airport_id = ? LIMIT 1', [id]);
  if (hasGates) {
    return res.status(409).json({ error: 'Cannot delete airport: Associated gates exist (REQ-NF05).' });
  }
  db.run('DELETE FROM airports WHERE airport_id = ?', [id]);
  res.json({ message: 'Airport removed.' });
});

// Aircraft CRUD
router.post('/aircraft', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const { airline_id, model, capacity } = req.body;
  if (!airline_id || !model || !capacity) return res.status(400).json({ error: 'Airline, model, and capacity required.' });

  try {
    const resDb = db.run('INSERT INTO aircraft (airline_id, model, capacity) VALUES (?, ?, ?)', [
      Number(airline_id), model.trim(), Number(capacity)
    ]);
    res.status(201).json({ message: 'Aircraft added.', aircraft_id: resDb.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/aircraft/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const id = Number(req.params.id);
  const hasFlights = db.get('SELECT flight_id FROM flights WHERE aircraft_id = ? LIMIT 1', [id]);
  if (hasFlights) {
    return res.status(409).json({ error: 'Cannot delete aircraft: Scheduled flights exist for this aircraft (REQ-NF05).' });
  }
  db.run('DELETE FROM aircraft WHERE aircraft_id = ?', [id]);
  res.json({ message: 'Aircraft removed.' });
});

module.exports = router;
