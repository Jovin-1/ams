const bcrypt = require('bcryptjs');
const db = require('./database');

function seedDatabase() {
  console.log('Seeding AMS Database...');

  // Wrap in a transaction
  db.transaction(() => {
    // 1. Clear existing data in reverse FK order
    db.exec(`
      DELETE FROM notifications;
      DELETE FROM payments;
      DELETE FROM baggage;
      DELETE FROM boarding_passes;
      DELETE FROM bookings;
      DELETE FROM flights;
      DELETE FROM gates;
      DELETE FROM airports;
      DELETE FROM aircraft;
      DELETE FROM airlines;
      DELETE FROM employees;
      DELETE FROM passengers;
      DELETE FROM users;
    `);

    const defaultPasswordHash = bcrypt.hashSync('password123', 10);

    // 2. Insert Users
    const insertUser = db.db.prepare(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run(1, 'Alex Mercer (Admin)', 'admin@airport.com', defaultPasswordHash, 'Admin');
    insertUser.run(2, 'Sarah Jenkins (Airline Staff)', 'airline@skywings.com', defaultPasswordHash, 'Airline Staff');
    insertUser.run(3, 'Marcus Vance (Ground Staff)', 'ground@airport.com', defaultPasswordHash, 'Ground Staff');
    insertUser.run(4, 'John Doe (Passenger)', 'john@example.com', defaultPasswordHash, 'Passenger');
    insertUser.run(5, 'Jane Smith (Passenger)', 'jane@example.com', defaultPasswordHash, 'Passenger');
    insertUser.run(6, 'Elena Rostova (Airline Staff)', 'elena@emirates.com', defaultPasswordHash, 'Airline Staff');

    // 3. Insert Passengers
    const insertPassenger = db.db.prepare(`
      INSERT INTO passengers (passenger_id, passport_no, phone)
      VALUES (?, ?, ?)
    `);
    insertPassenger.run(4, 'A12345678', '+1-555-0199');
    insertPassenger.run(5, 'B98765432', '+1-555-0288');

    // 4. Insert Employees
    const insertEmployee = db.db.prepare(`
      INSERT INTO employees (employee_id, department, designation, attendance_status, shift_schedule, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertEmployee.run(1, 'Airport Operations', 'Chief Administrator', 'Present', '08:00 - 16:00', 1);
    insertEmployee.run(2, 'Flight Dispatch', 'Senior Flight Controller', 'Present', '06:00 - 14:00', 1);
    insertEmployee.run(3, 'Ground Logistics', 'Lead Gate & Ramp Officer', 'Present', '14:00 - 22:00', 1);
    insertEmployee.run(6, 'Airline Management', 'Flight Operations Manager', 'Present', '09:00 - 17:00', 1);

    // 5. Insert Airlines
    const insertAirline = db.db.prepare(`
      INSERT INTO airlines (airline_id, airline_name, code)
      VALUES (?, ?, ?)
    `);
    insertAirline.run(1, 'SkyWings Airlines', 'SW');
    insertAirline.run(2, 'Emirates Global', 'EK');
    insertAirline.run(3, 'Air India', 'AI');
    insertAirline.run(4, 'Lufthansa', 'LH');
    insertAirline.run(5, 'Delta Air Lines', 'DL');

    // 6. Insert Airports
    const insertAirport = db.db.prepare(`
      INSERT INTO airports (airport_id, airport_name, city, country, code)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertAirport.run(1, 'Chhatrapati Shivaji Maharaj Intl', 'Mumbai', 'India', 'BOM');
    insertAirport.run(2, 'Indira Gandhi International', 'New Delhi', 'India', 'DEL');
    insertAirport.run(3, 'Dubai International Airport', 'Dubai', 'United Arab Emirates', 'DXB');
    insertAirport.run(4, 'Heathrow Airport', 'London', 'United Kingdom', 'LHR');
    insertAirport.run(5, 'John F. Kennedy International', 'New York', 'United States', 'JFK');
    insertAirport.run(6, 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SIN');

    // 7. Insert Aircraft
    const insertAircraft = db.db.prepare(`
      INSERT INTO aircraft (aircraft_id, airline_id, model, capacity)
      VALUES (?, ?, ?, ?)
    `);
    insertAircraft.run(1, 1, 'Boeing 737-800', 160);
    insertAircraft.run(2, 1, 'Airbus A320neo', 150);
    insertAircraft.run(3, 2, 'Boeing 777-300ER', 300);
    insertAircraft.run(4, 2, 'Airbus A380-800', 450);
    insertAircraft.run(5, 3, 'Boeing 787-8 Dreamliner', 250);
    insertAircraft.run(6, 4, 'Airbus A350-900', 280);

    // 8. Insert Gates
    const insertGate = db.db.prepare(`
      INSERT INTO gates (gate_id, airport_id, gate_number, status)
      VALUES (?, ?, ?, ?)
    `);
    insertGate.run(1, 1, 'Gate A1', 'Occupied');
    insertGate.run(2, 1, 'Gate A2', 'Available');
    insertGate.run(3, 1, 'Gate B1', 'Available');
    insertGate.run(4, 1, 'Gate B2', 'Under Maintenance');
    insertGate.run(5, 2, 'Gate 10A', 'Available');
    insertGate.run(6, 3, 'Gate C22', 'Available');

    // 9. Insert Flights
    const insertFlight = db.db.prepare(`
      INSERT INTO flights (flight_id, airline_id, aircraft_id, departure, arrival, departure_time, arrival_time, status, gate_id, price, delay_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Dates relative to current demo
    const now = new Date();
    const isoPlusHours = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    insertFlight.run('SW-101', 1, 1, 'Mumbai (BOM)', 'New Delhi (DEL)', isoPlusHours(2), isoPlusHours(4.2), 'Boarding', 1, 180.00, null);
    insertFlight.run('EK-505', 2, 3, 'Mumbai (BOM)', 'Dubai (DXB)', isoPlusHours(5), isoPlusHours(8.5), 'Scheduled', 2, 350.00, null);
    insertFlight.run('AI-302', 3, 5, 'New Delhi (DEL)', 'London (LHR)', isoPlusHours(8), isoPlusHours(17.5), 'Scheduled', null, 620.00, null);
    insertFlight.run('LH-756', 4, 6, 'Mumbai (BOM)', 'London (LHR)', isoPlusHours(-1), isoPlusHours(9), 'Departed', null, 710.00, null);
    insertFlight.run('SW-204', 1, 2, 'New Delhi (DEL)', 'Mumbai (BOM)', isoPlusHours(3.5), isoPlusHours(5.8), 'Delayed', null, 175.00, 'Air traffic congestion at destination');
    insertFlight.run('EK-202', 2, 4, 'Dubai (DXB)', 'New York (JFK)', isoPlusHours(10), isoPlusHours(24), 'Scheduled', 6, 890.00, null);

    // 10. Insert Bookings
    const insertBooking = db.db.prepare(`
      INSERT INTO bookings (booking_id, passenger_id, flight_id, seat_no, booking_status, booking_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertBooking.run('BK-1001', 4, 'SW-101', '12A', 'Confirmed', isoPlusHours(-24));
    insertBooking.run('BK-1002', 4, 'EK-505', '14C', 'Confirmed', isoPlusHours(-12));
    insertBooking.run('BK-1003', 5, 'SW-101', '12B', 'Confirmed', isoPlusHours(-20));
    insertBooking.run('BK-1004', 5, 'SW-204', '04A', 'Cancelled', isoPlusHours(-15));

    // 11. Insert Boarding Pass (for checked-in booking BK-1001)
    const insertBoardingPass = db.db.prepare(`
      INSERT INTO boarding_passes (pass_id, booking_id, gate, boarding_time, qr_code, issued_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertBoardingPass.run('BP-8801', 'BK-1001', 'Gate A1', isoPlusHours(1.5), 'AMS-BP-8801-SW101-12A', isoPlusHours(-1));

    // 12. Insert Baggage
    const insertBaggage = db.db.prepare(`
      INSERT INTO baggage (baggage_id, booking_id, weight, status, incident_report, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertBaggage.run('BAG-9001', 'BK-1001', 18.5, 'Loaded', null, isoPlusHours(-0.5));
    insertBaggage.run('BAG-9002', 'BK-1002', 22.0, 'Checked-In', null, isoPlusHours(-2));
    insertBaggage.run('BAG-9003', 'BK-1003', 14.2, 'Checked-In', null, isoPlusHours(-1));

    // 13. Insert Payments
    const insertPayment = db.db.prepare(`
      INSERT INTO payments (payment_id, booking_id, amount, payment_status, payment_method, transaction_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertPayment.run('PAY-501', 'BK-1001', 180.00, 'Success', 'Credit Card (Mock)', 'TXN-SW-998811', isoPlusHours(-24));
    insertPayment.run('PAY-502', 'BK-1002', 350.00, 'Success', 'UPI (Mock)', 'TXN-EK-772211', isoPlusHours(-12));
    insertPayment.run('PAY-503', 'BK-1003', 180.00, 'Success', 'Net Banking (Mock)', 'TXN-SW-665544', isoPlusHours(-20));
    insertPayment.run('PAY-504', 'BK-1004', 175.00, 'Success', 'Credit Card (Mock)', 'TXN-SW-112233', isoPlusHours(-15));

    // 14. Insert Notifications (REQ-F24)
    const insertNotification = db.db.prepare(`
      INSERT INTO notifications (user_id, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertNotification.run(4, 'Flight SW-101 is now Boarding at Gate A1. Please proceed to the gate.', 'ALERT', 0, isoPlusHours(-0.5));
    insertNotification.run(4, 'Your booking BK-1002 on Emirates EK-505 is confirmed for tomorrow.', 'INFO', 1, isoPlusHours(-12));
    insertNotification.run(5, 'Flight SW-204 schedule has been updated to Delayed due to airspace congestion.', 'WARNING', 0, isoPlusHours(-2));
  });

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
