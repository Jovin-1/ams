const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// REQ-F21: View Passenger Profile
router.get('/profile', (req, res) => {
  try {
    const user = db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    let details = {};
    if (user.role === 'Passenger') {
      details = db.get('SELECT passport_no, phone FROM passengers WHERE passenger_id = ?', [user.id]) || {};
    }
    res.json({ profile: { ...user, ...details } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// REQ-F21: Update Passenger Profile
router.put('/profile', (req, res) => {
  const { name, phone, passport_no } = req.body;

  try {
    db.transaction(() => {
      if (name) {
        db.run('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
      }
      if (req.user.role === 'Passenger') {
        const existing = db.get('SELECT passenger_id FROM passengers WHERE passenger_id = ?', [req.user.id]);
        if (existing) {
          db.run(`
            UPDATE passengers
            SET phone = COALESCE(?, phone),
                passport_no = COALESCE(?, passport_no)
            WHERE passenger_id = ?
          `, [phone, passport_no, req.user.id]);
        } else {
          db.run('INSERT INTO passengers (passenger_id, passport_no, phone) VALUES (?, ?, ?)', [
            req.user.id, passport_no || '', phone || ''
          ]);
        }
      }
    });

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// REQ-F24: Passenger In-App Notifications
router.get('/notifications', (req, res) => {
  try {
    const notifications = db.query(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id]);

    const unreadCount = db.get(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [req.user.id]).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', (req, res) => {
  try {
    db.run('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?', [
      Number(req.params.id), req.user.id
    ]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Mark all as read
router.put('/notifications/mark-all-read', (req, res) => {
  try {
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications.' });
  }
});

module.exports = router;
