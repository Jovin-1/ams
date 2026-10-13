const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Ensure DB is initialized
require('./db/database');

const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flights');
const bookingRoutes = require('./routes/bookings');
const boardingPassRoutes = require('./routes/boardingPass');
const baggageRoutes = require('./routes/baggage');
const gateRoutes = require('./routes/gates');
const employeeRoutes = require('./routes/employees');
const dashboardRoutes = require('./routes/dashboard');
const masterRoutes = require('./routes/master');
const passengerRoutes = require('./routes/passenger');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (Section 3.4)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api', bookingRoutes); // provides /api/book, /api/my-bookings, /api/booking/:id
app.use('/api', boardingPassRoutes); // provides /api/checkin, /api/boarding-pass/:id
app.use('/api/baggage', baggageRoutes);
app.use('/api/gates', gateRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/passenger', passengerRoutes);

// Mock payment route alias per Section 6.2 (POST /payment)
app.post('/api/payment', (req, res) => {
  const { booking_id, amount, payment_method = 'Mock Gateway' } = req.body;
  res.json({
    payment_id: `PAY-${Date.now()}`,
    booking_id,
    amount,
    payment_status: 'Success',
    transaction_id: `TXN-AMS-${Math.floor(10000000 + Math.random() * 90000000)}`,
    message: 'Mock payment processed successfully.'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Airport Management System (AMS)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AMS Backend Server running at http://localhost:${PORT}`);
});

module.exports = app;
