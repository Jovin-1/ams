const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// REQ-F29: All employee routes restricted to Admin
router.use(authenticateToken, authorizeRoles('Admin'));

// List all employees
router.get('/', (req, res) => {
  try {
    const employees = db.query(`
      SELECT e.*, u.name, u.email, u.role, u.created_at
      FROM employees e
      JOIN users u ON e.employee_id = u.id
      ORDER BY e.is_active DESC, u.name ASC
    `);
    res.json({ employees });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve employees.' });
  }
});

// REQ-F26: Create Employee record linked to User
router.post('/', (req, res) => {
  const { name, email, password = 'password123', role = 'Airline Staff', department, designation, shift_schedule } = req.body;

  if (!name || !email || !department || !designation) {
    return res.status(400).json({ error: 'Name, email, department, and designation are required.' });
  }

  try {
    const existing = db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const emp = db.transaction(() => {
      const userRes = db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name.trim(), email.trim().toLowerCase(), hashedPassword, role]
      );
      const userId = userRes.lastInsertRowid;

      db.run(`
        INSERT INTO employees (employee_id, department, designation, attendance_status, shift_schedule, is_active)
        VALUES (?, ?, ?, 'Present', ?, 1)
      `, [userId, department.trim(), designation.trim(), shift_schedule || '09:00 - 17:00']);

      return { id: userId, name: name.trim(), email: email.trim().toLowerCase(), role, department, designation };
    });

    res.status(201).json({ message: 'Employee created successfully.', employee: emp });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Failed to create employee.' });
  }
});

// REQ-F26: Update Employee details or deactivate/activate
router.put('/:id', (req, res) => {
  const empId = Number(req.params.id);
  const { department, designation, is_active, name } = req.body;

  try {
    db.transaction(() => {
      if (name) {
        db.run('UPDATE users SET name = ? WHERE id = ?', [name.trim(), empId]);
      }
      db.run(`
        UPDATE employees
        SET department = COALESCE(?, department),
            designation = COALESCE(?, designation),
            is_active = COALESCE(?, is_active)
        WHERE employee_id = ?
      `, [department, designation, is_active, empId]);
    });

    res.json({ message: 'Employee updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee.' });
  }
});

// REQ-F27: Update Attendance
router.put('/:id/attendance', (req, res) => {
  const empId = Number(req.params.id);
  const { attendance_status } = req.body;

  const validStatuses = ['Present', 'Absent', 'On Leave', 'Late'];
  if (!validStatuses.includes(attendance_status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    db.run('UPDATE employees SET attendance_status = ? WHERE employee_id = ?', [attendance_status, empId]);
    res.json({ message: `Attendance updated to '${attendance_status}'.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update attendance.' });
  }
});

// REQ-F28: Update Shift Schedule
router.put('/:id/shift', (req, res) => {
  const empId = Number(req.params.id);
  const { shift_schedule } = req.body;

  if (!shift_schedule) {
    return res.status(400).json({ error: 'Shift schedule is required.' });
  }

  try {
    db.run('UPDATE employees SET shift_schedule = ? WHERE employee_id = ?', [shift_schedule, empId]);
    res.json({ message: 'Shift schedule updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shift schedule.' });
  }
});

module.exports = router;
