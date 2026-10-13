const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// REQ-F01, REQ-F02: User Registration
router.post('/signup', (req, res) => {
  const { name, email, password, role = 'Passenger', phone, passport_no, department, designation } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required fields.' });
  }

  const validRoles = ['Admin', 'Airline Staff', 'Passenger', 'Ground Staff'];
  const userRole = validRoles.includes(role) ? role : 'Passenger';

  try {
    const existing = db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.transaction(() => {
      const userRes = db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name.trim(), email.trim().toLowerCase(), hashedPassword, userRole]
      );
      const userId = userRes.lastInsertRowid;

      if (userRole === 'Passenger') {
        db.run(
          'INSERT INTO passengers (passenger_id, passport_no, phone) VALUES (?, ?, ?)',
          [userId, passport_no || '', phone || '']
        );
      } else {
        db.run(
          'INSERT INTO employees (employee_id, department, designation) VALUES (?, ?, ?)',
          [userId, department || 'General Airport Staff', designation || userRole]
        );
      }

      return { id: userId, name: name.trim(), email: email.trim().toLowerCase(), role: userRole };
    });

    const token = jwt.sign(
      { id: result.id, name: result.name, email: result.email, role: result.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: result
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error while creating user account.' });
  }
});

// REQ-F03, REQ-F04: User Authentication / Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Invalid credentials. Please provide email and password.' });
  }

  try {
    const user = db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    
    // REQ-F04: Generic error message without revealing if email or password was wrong
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let extraDetails = {};
    if (user.role === 'Passenger') {
      const pass = db.get('SELECT * FROM passengers WHERE passenger_id = ?', [user.id]);
      extraDetails = pass || {};
    } else {
      const emp = db.get('SELECT * FROM employees WHERE employee_id = ?', [user.id]);
      extraDetails = emp || {};
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' } // Configurable duration per REQ-F07 / TBD-01
    );

    res.json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...extraDetails
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
});

// REQ-F06: Forgot Password Flow
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const user = db.get('SELECT id, email FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!user) {
    // Standard security practice: return friendly message regardless to prevent user enumeration
    return res.json({ message: 'If an account exists with this email, a reset instructions link has been dispatched.' });
  }

  // Simulated OTP/Reset link
  res.json({
    message: 'A password reset token has been generated.',
    resetToken: `AMS-RESET-${Math.floor(100000 + Math.random() * 900000)}`,
    note: 'In this simulation environment, your password can be updated directly via the reset dialog.'
  });
});

// Reset Password with token
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  const user = db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

  res.json({ message: 'Password has been reset successfully. You can now login.' });
});

// Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    let extraDetails = {};
    if (user.role === 'Passenger') {
      extraDetails = db.get('SELECT passport_no, phone FROM passengers WHERE passenger_id = ?', [user.id]) || {};
    } else {
      extraDetails = db.get('SELECT department, designation, attendance_status, shift_schedule FROM employees WHERE employee_id = ?', [user.id]) || {};
    }

    res.json({ user: { ...user, ...extraDetails } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

module.exports = router;
