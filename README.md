# AeroSync — Airport Management System (AMS)

**IEEE/ISO/IEC 29148:2018-Aligned Web Application**  
*Department of Computer Engineering, MCT's Rajiv Gandhi Institute of Technology (RGIT), Mumbai*

---

## 🛫 Overview

AeroSync is a full-stack, enterprise-grade web application built in exact alignment with the **Airport Management System Software Requirements Specification (Version 1.0)** and accompanying UML analysis models (`USE.pdf`, `ACT.pdf`, `act2.pdf`, `act3.pdf`, `DFDL0.pdf`, `DFDL1.pdf`, `DFDLVL2.pdf`, `C-CLASS.pdf`, `I-CLASS.pdf`).

The platform provides dedicated, role-tailored consoles for **Passengers**, **Airline Staff**, **Ground Operations Staff**, and **System Administrators**, backed by a 3NF normalized relational database, JWT-based Role-Based Access Control (RBAC), and simulated real-time operational flows.

---

## 🛠 Technology Stack (SRS Section 2.4, 2.5 & 3.3)

| Component | Technology | Description |
|---|---|---|
| **Frontend UI** | **React.js 18.x** | Utility component architecture, client-side routing with React Router 6.x |
| **Styling** | **Tailwind CSS 3.x** | Responsive design down to 375px mobile viewports (REQ-NF15), custom dark aviation theme |
| **Icons & Extras** | **Lucide Icons & Canvas Confetti** | Streamlined iconography and interactive booking celebrations |
| **PDF & QR Engine** | **jsPDF 2.5 & QRCode 1.5** | Dynamic Boarding Pass rendering with downloadable PDF (act3.pdf, REQ-F23) |
| **Backend API** | **Node.js 20.x + Express.js 4.x** | RESTful modular routes, controllers, middleware and CORS security |
| **Authentication** | **JWT (jsonwebtoken 9.x) & bcrypt** | One-way hashing (bcryptjs) & claims-based RBAC authorization (REQ-F02, REQ-F05) |
| **Database** | **Relational 3NF (SQLite & MySQL 8.x)** | Fully normalized 11 core tables with foreign keys and cascade integrity (Section 6.1) |

---

## 📋 Pre-Seeded Evaluation Accounts

The system is seeded with realistic demonstration accounts. You can also quickly switch roles using the **"Role"** selector in the top navigation bar.

| Role | Email | Password | Access & Responsibilities |
|---|---|---|---|
| **Admin** | `admin@airport.com` | `password123` | Master data (Airlines, Airports, Fleet, Gates, Staff attendance/shifts), KPI dashboard, revenue & delay charts. |
| **Airline Staff** | `airline@skywings.com` | `password123` | Flight scheduling (overlap conflict check), flight status broadcaster, passenger manifests. |
| **Ground Staff** | `ground@airport.com` | `password123` | High-contrast terminal, rapid check-in verification, Smart Gate suggestions, baggage logistics. |
| **Passenger** | `john@example.com` | `password123` | Flight search, interactive seat selection, mock checkout, boarding pass download, baggage tracking. |
| **Passenger 2** | `jane@example.com` | `password123` | Secondary passenger for concurrent booking conflict testing. |

---

## 🗺️ SRS & UML Requirements Traceability Matrix

### 1. External Models & Diagrams in `/home/jovin/Desktop/ams/`
- **`USE.pdf` (Use Case Diagram):** Covers Authenticate User, Search Flights, Book Ticket, Process Payment/Refund, Cancel Ticket, Track Baggage, Check in Passenger, Generate Boarding Pass, Assign Gate, Schedule/Update Flight, and Manage Airport/Airlines/Aircraft/Employees.
- **`ACT.pdf` (Activity Diagram — Search Flights):** Search by origin, destination, date; validates input correctness (rejects same origin/destination); queries database; displays available flights or error banner.
- **`act2.pdf` (Activity Diagram — Track Baggage Status):** Enter Baggage Tag ID; validates tag validity; searches database; renders real-time milestone timeline (`Checked-In` → `Loaded` → `In-Transit` → `Delivered`) or logs lost-baggage incident.
- **`act3.pdf` (Activity Diagram — Get Boarding Pass):** Search booking number; checks database if passenger checked in; renders interactive pass with QR code and provides one-click PDF download.
- **`DFDL0.pdf`, `DFDL1.pdf`, `DFDLVL2.pdf` (Data Flow Diagrams):** Context level, Level 1, and Level 2 process decomposition for search, scheduling, check-in, and administration.
- **`C-CLASS.pdf` & `I-CLASS.pdf` (Class Diagrams):** Conceptual and implementation class models across Users, Passengers, Employees, Airlines, Aircraft, Flights, Airports, Gates, Bookings, BoardingPass, Baggage, and Payments.

### 2. Functional Requirements Coverage (Section 4)
- **Authentication (REQ-F01 – REQ-F07):** Registration, bcrypt password hashing, JWT issuing and role claim verification, generic error message security, mock password reset flow, token expiry.
- **Flight Management (REQ-F08 – REQ-F13):** Add flight with route/time/carrier, update flight schedule or status, delete protection (REQ-NF05: prevents deletion if active bookings exist), flight search with airline & status filters, aircraft double-scheduling prevention (REQ-F12), arrival > departure validation (REQ-F13).
- **Booking Module (REQ-F14 – REQ-F20):** Interactive cabin seat-map layout with capacity checking, available seat selection, mock payment gateway (Credit Card, UPI, Net Banking), atomic transaction booking confirmation, seat double-booking prevention (REQ-F18), cancellation cutoff with seat release and mock refund (REQ-F19), complete booking history (REQ-F20).
- **Passenger Module (REQ-F21 – REQ-F25):** Profile details updating (REQ-NF10 sensitive field protection), digital boarding pass generation, jsPDF download, in-app notification broadcasting when flight status changes, simulated live radar tracking.
- **Employee Module (REQ-F26 – REQ-F29):** Admin-only CRUD for staff, daily attendance recorder (`Present`, `Absent`, `On Leave`, `Late`), shift schedule manager (`09:00 - 17:00`).
- **Baggage Module (REQ-F30 – REQ-F33):** Registration with scales weight, status progression (`Checked-In`, `Loaded`, `In-Transit`, `Delivered`, `Lost`), lost baggage incident report filing, real-time passenger tracker.
- **Gate Management & Boarding (REQ-F34 – REQ-F38):** Assign available gate, gate collision/overlap prevention, passenger check-in verification via booking ID / QR scan, Smart Gate recommendation algorithm matching wide-body aircraft to large capacity gates.
- **Dashboard & Reporting (REQ-F39 – REQ-F42):** Real-time KPI cards (Total Flights, Delays, Active Passengers, Revenue, Available Gates), bar and trend charts, start/end date range filter, auto-refresh interval (15s, 30s, 60s, or manual).

### 3. Advanced / Stand-Out Features Included
- **Multi-Language Interface (Section 6.3 / TBD-04):** Instant UI language toggle between **English**, **हिन्दी (Hindi)**, **Español (Spanish)**, and **Français (French)**.
- **Onboarding Guide & Tour Modal (Section 2.6 / REQ-NF12):** Built-in guided walkthrough explaining each role's workflow with zero external assistance required.
- **Simulated Flight Radar & Telemetry (REQ-F25):** Live flight trajectory simulator with simulated altitude, speed, and en-route progress.

---

## 🚀 Running the Application

### Option A: Using the All-in-One Startup Script
From the `/home/jovin/Desktop/ams` folder:
```bash
bash start.sh
```
This automatically starts:
- **Backend API:** `http://localhost:5000`
- **Frontend App:** `http://localhost:3000`

### Option B: Running Separately
1. **Backend Server:**
   ```bash
   cd /home/jovin/Desktop/ams/backend
   node server.js
   ```
2. **Frontend Client:**
   ```bash
   cd /home/jovin/Desktop/ams/frontend
   npm run dev -- --port 3000
   ```
3. **Re-seeding Mock Data (Optional):**
   ```bash
   cd /home/jovin/Desktop/ams/backend
   node db/seed.js
   ```

---

## 🗄️ Database Schema & Normalization

The complete 3NF relational schema is defined in [backend/db/schema.sql](file:///home/jovin/Desktop/ams/backend/db/schema.sql), comprising 11 core tables matching Section 6.1:
`users`, `passengers`, `employees`, `airlines`, `aircraft`, `airports`, `gates`, `flights`, `bookings`, `boarding_passes`, `baggage`, `payments`, and `notifications`.
# ams
# ams
# ams
