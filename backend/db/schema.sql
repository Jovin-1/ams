-- Airport Management System (AMS) v1.0
-- Database Schema normalized to 3NF
-- Compatible with MySQL 8.x and SQLite

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('Admin', 'Airline Staff', 'Passenger', 'Ground Staff')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Passengers Table (1:1 with Users for Passenger role)
CREATE TABLE IF NOT EXISTS passengers (
  passenger_id INTEGER PRIMARY KEY,
  passport_no VARCHAR(50),
  phone VARCHAR(30),
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Employees Table (1:1 with Users for Staff/Admin roles)
CREATE TABLE IF NOT EXISTS employees (
  employee_id INTEGER PRIMARY KEY,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  attendance_status VARCHAR(50) DEFAULT 'Present',
  shift_schedule VARCHAR(100) DEFAULT '09:00 - 17:00',
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Airlines Table
CREATE TABLE IF NOT EXISTS airlines (
  airline_id INTEGER PRIMARY KEY AUTOINCREMENT,
  airline_name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE
);

-- 5. Aircraft Table
CREATE TABLE IF NOT EXISTS aircraft (
  aircraft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  airline_id INTEGER NOT NULL,
  model VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL CHECK(capacity > 0),
  FOREIGN KEY (airline_id) REFERENCES airlines(airline_id) ON DELETE RESTRICT
);

-- 6. Airports Table
CREATE TABLE IF NOT EXISTS airports (
  airport_id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE
);

-- 7. Gates Table
CREATE TABLE IF NOT EXISTS gates (
  gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_id INTEGER NOT NULL,
  gate_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'Available' CHECK(status IN ('Available', 'Occupied', 'Under Maintenance')),
  FOREIGN KEY (airport_id) REFERENCES airports(airport_id) ON DELETE RESTRICT
);

-- 8. Flights Table
CREATE TABLE IF NOT EXISTS flights (
  flight_id VARCHAR(20) PRIMARY KEY,
  airline_id INTEGER NOT NULL,
  aircraft_id INTEGER NOT NULL,
  departure VARCHAR(100) NOT NULL,
  arrival VARCHAR(100) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Delayed', 'Boarding', 'Departed', 'Cancelled', 'Arrived')),
  gate_id INTEGER,
  price DECIMAL(10, 2) DEFAULT 150.00,
  delay_reason VARCHAR(255),
  FOREIGN KEY (airline_id) REFERENCES airlines(airline_id) ON DELETE RESTRICT,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(aircraft_id) ON DELETE RESTRICT,
  FOREIGN KEY (gate_id) REFERENCES gates(gate_id) ON DELETE SET NULL
);

-- 9. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  booking_id VARCHAR(30) PRIMARY KEY,
  passenger_id INTEGER NOT NULL,
  flight_id VARCHAR(20) NOT NULL,
  seat_no VARCHAR(10) NOT NULL,
  booking_status VARCHAR(50) DEFAULT 'Confirmed' CHECK(booking_status IN ('Confirmed', 'Cancelled', 'Pending')),
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id) ON DELETE RESTRICT,
  FOREIGN KEY (flight_id) REFERENCES flights(flight_id) ON DELETE RESTRICT,
  CONSTRAINT unique_flight_seat UNIQUE (flight_id, seat_no)
);

-- 10. BoardingPass Table
CREATE TABLE IF NOT EXISTS boarding_passes (
  pass_id VARCHAR(30) PRIMARY KEY,
  booking_id VARCHAR(30) NOT NULL UNIQUE,
  gate VARCHAR(20) NOT NULL,
  boarding_time DATETIME NOT NULL,
  qr_code TEXT,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 11. Baggage Table
CREATE TABLE IF NOT EXISTS baggage (
  baggage_id VARCHAR(30) PRIMARY KEY,
  booking_id VARCHAR(30) NOT NULL,
  weight DECIMAL(5, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Checked-In' CHECK(status IN ('Checked-In', 'Loaded', 'In-Transit', 'Delivered', 'Lost')),
  incident_report TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 12. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  payment_id VARCHAR(40) PRIMARY KEY,
  booking_id VARCHAR(30) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'Success' CHECK(payment_status IN ('Success', 'Failed', 'Pending')),
  payment_method VARCHAR(50) DEFAULT 'Credit Card (Mock)',
  transaction_id VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 13. Notifications Table (REQ-F24)
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO',
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
