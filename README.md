# Harmony Booking Engine - Multi-Role Appointment System

A comprehensive full-stack appointment booking system built with **React**, **Node.js/Express**, and **MongoDB**. Supports three user roles (System Admin, Service Provider, End User) with dynamic availability computation, strict appointment state management, comprehensive audit logging, and business rule enforcement.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Design Decisions](#design-decisions)
- [Sample Credentials](#sample-credentials)

---

## ✨ Features

### Core Functionality
- **Multi-Role System**: System Admin, Service Provider, End User
- **Dynamic Availability Engine**: Computes available slots without storing them
- **Appointment State Machine**: Strict state transitions (REQUESTED → APPROVED → IN_PROGRESS → COMPLETED)
- **Business Rule Enforcement**: Prevents overlapping bookings, enforces daily limits
- **Comprehensive Audit Logging**: Tracks all significant actions with actor, timestamp, old/new values
- **Advanced Analytics**: Provider utilization, cancellation rankings, system-wide reports

### Admin Features
- User management (view, deactivate)
- Provider approval/rejection workflow
- System-wide audit logs with filtering
- Analytics dashboard (utilization, cancellations)

### Provider Features
- Profile management (services, pricing, bio)
- Availability rules (day-based time windows, exception dates)
- Appointment management (approve, reject, update status)
- Statistics dashboard (total, completed, pending, utilization rate)

### User Features
- Browse providers with search/filter
- Compute real-time availability
- Book appointments with automatic validation
- View and cancel appointments
- Appointment history

---

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **date-fns** - Date manipulation for availability computation

### Frontend
- **React** 18 - UI library
- **React Router** - Client-side routing
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **React Hook Form** + **Zod** - Form validation
- **React Toastify** - Notifications
- **date-fns** - Date formatting

---

## 🏗 Architecture

### Data Modeling

**Collections:**
1. **users** - All users with role (SYSTEM_ADMIN, SERVICE_PROVIDER, END_USER)
2. **providers** - Extended profile for service providers
3. **appointments** - Booking records with state machine
4. **availability_rules** - Provider availability schedules (day-based with exception dates)
5. **audit_logs** - Complete audit trail for all operations

### Availability Computation Approach

**Design:** Slots are **computed dynamically** and **never stored** in the database.

**Algorithm:**
1. Query `availability_rules` for provider's day-of-week rules
2. Check `exception_dates` for blocked days (holidays, personal time)
3. Generate all possible slots from time windows using `slotDuration`
4. Query existing `appointments` with status REQUESTED/APPROVED/IN_PROGRESS
5. Filter out booked slots from generated slots
6. Return available slots

**Benefits:**
- No data redundancy
- Real-time accuracy
- Handles cancellations automatically
- Scalable for millions of slots

### Appointment State Machine

```
REQUESTED ──┬──> APPROVED ──┬──> IN_PROGRESS ──> COMPLETED
            │                │
            ├──> REJECTED    └──> CANCELLED
            │
            └──> CANCELLED
```

**Role-Based Transitions:**
- **Users**: Can request and cancel appointments
- **Providers**: Can approve, reject, mark in-progress, complete
- **Admins**: Full control over all transitions

### Overlap Prevention Logic

**Two-Level Check:**
1. **Provider Overlap**: Prevents double-booking the same provider
2. **User Overlap**: Prevents user from booking multiple appointments at same time

**Implementation:** 
- MongoDB compound index on `(providerId, date, startTime)`
- Static method `Appointment.checkOverlap()` with time range comparison
- Atomic check before appointment creation

### Race Condition Handling

**Strategy:** Database-level validation + application-level checks

1. **Compound Unique Indexes**: Prevent duplicate bookings
2. **Atomic Queries**: Check + Insert in single operation
3. **Daily Limit Counters**: Validate before creation
4. **Time Range Comparison**: Detect overlaps in application logic

**Production Improvement:** Use MongoDB transactions for multi-document atomicity

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** 6+ (local or Atlas)
- **Git**

### Clone Repository

```bash
git clone <your-repo-url>
cd Harmony
```

### Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## ⚙️ Environment Setup

### Backend (.env)

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/harmony-booking
JWT_SECRET=harmony_booking_secret_key_2026_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/harmony-booking?retryWrites=true&w=majority
```

### Frontend (.env)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Running the Application

### Start MongoDB (if running locally)

```bash
mongod
```

### Start Backend Server

```bash
cd backend
npm run dev
```

Backend runs on **http://localhost:5000**

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## 📚 API Documentation

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/verify` | Verify JWT token | Private |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users with pagination |
| DELETE | `/users/:id` | Deactivate user |
| GET | `/providers/pending` | Get pending provider approvals |
| PUT | `/providers/:userId/approve` | Approve provider |
| PUT | `/providers/:userId/reject` | Reject provider |
| GET | `/audit-logs` | Get system audit logs |
| GET | `/analytics/provider-utilization` | Provider utilization stats |
| GET | `/analytics/cancellation-ranking` | Users with most cancellations |

### Provider Routes (`/api/provider`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get provider profile |
| PUT | `/profile` | Update provider profile |
| GET | `/availability` | Get availability rules |
| POST | `/availability` | Create availability rule |
| PUT | `/availability/:id` | Update availability rule |
| GET | `/appointments` | Get appointments with filters |
| PUT | `/appointments/:id/status` | Update appointment status |
| GET | `/stats` | Get provider statistics |

### User Routes (`/api/user`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/providers` | Browse providers with search/filter |
| GET | `/providers/:id` | Get provider details |
| POST | `/compute-availability` | Compute available slots |
| POST | `/appointment` | Create appointment request |
| GET | `/appointments` | Get user's appointments |
| GET | `/appointments/:id` | Get appointment details |
| PUT | `/appointments/:id/cancel` | Cancel appointment |

---

## 🗄 Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum['SYSTEM_ADMIN', 'SERVICE_PROVIDER', 'END_USER'],
  phone: String,
  isActive: Boolean,
  isApproved: Boolean,
  maxAppointmentsPerDay: Number
}
```

### Provider Schema
```javascript
{
  userId: ObjectId (ref: User),
  businessName: String,
  serviceType: Enum,
  description: String,
  pricing: { basePrice, currency, pricingModel },
  location: { address, city, state, coordinates },
  slotDuration: Number (minutes),
  maxAppointmentsPerDay: Number,
  rating: { average, count }
}
```

### Appointment Schema
```javascript
{
  appointmentId: String (unique),
  userId: ObjectId,
  providerId: ObjectId,
  date: Date,
  startTime: String (HH:mm),
  endTime: String (HH:mm),
  status: Enum['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED'],
  notes: String,
  statusHistory: Array
}
```

### AvailabilityRule Schema
```javascript
{
  providerId: ObjectId,
  dayOfWeek: Enum['MONDAY', 'TUESDAY', ...],
  timeSlots: [{ startTime, endTime }],
  exceptionDates: [{ date, reason, type }],
  isActive: Boolean
}
```

### AuditLog Schema
```javascript
{
  action: Enum (action types),
  actor: { userId, email, role },
  entity: { type, id },
  changes: { oldValue, newValue },
  metadata: { ipAddress, userAgent, method, endpoint },
  timestamp: Date
}
```

---

## 🎯 Design Decisions

### 1. Schema Design Rationale

**Separation of User and Provider:** 
- Users table stores authentication and role data
- Provider table stores business-specific data
- Allows easy user-to-provider lookups and role changes

**Embedded vs Referenced:**
- `statusHistory` embedded in Appointment (1-to-few, queried together)
- `userId`/`providerId` referenced (1-to-many, independent queries)

### 2. Availability Computation vs Storage

**Decision:** Compute dynamically instead of pre-generating slots

**Reasoning:**
- Reduces storage by ~10,000x (100 daily slots × 365 days × N providers)
- Real-time accuracy (cancellations immediately free slots)
- Flexible slot durations (can change without migration)
- Simpler conflict resolution

**Trade-off:** 
- Slight computational overhead (~50ms per query)
- Mitigated by indexes and caching strategies

### 3. State Machine Enforcement

**Decision:** Validate transitions at API level + Mongoose middleware

**Benefits:**
- Prevents invalid state changes
- Clear audit trail via `statusHistory`
- Role-based transition rules

### 4. Audit Logging Middleware

**Decision:** Middleware-based automatic logging

**Benefits:**
- No code duplication
- Consistent log format
- Can't be forgotten by developers
- Non-blocking (async logging)

---

## 🔐 Sample Credentials

**System Admin:**
```
Email: admin@harmony.com
Password: admin123
```

**Service Provider:**
```
Email: provider@harmony.com
Password: provider123
```

**End User:**
```
Email: user@harmony.com
Password: user123
```

**Note:** Create these users by registering through the UI or using Postman.

---

## 🧪 Testing

### Using Postman

1. Import the Postman collection (if provided)
2. Set environment variable `BASE_URL` to `http://localhost:5000/api`
3. Register users with different roles
4. Login to get JWT token
5. Test role-based endpoints

### Manual Testing Flow

1. **Register as Provider** → Check pending approval in admin
2. **Login as Admin** → Approve provider
3. **Login as Provider** → Set availability rules
4. **Login as User** → Browse providers
5. **User** → Compute availability → Book appointment
6. **Provider** → View requests → Approve appointment
7. **Admin** → View audit logs and analytics

---

## 📊 Scalability Limitations

### Current Limitations

1. **No Database Transactions:** Race conditions possible under high concurrency
2. **In-Memory State:** No Redis caching for computed slots
3. **Synchronous Availability Computation:** Could block under load
4. **No Rate Limiting:** APIs vulnerable to abuse
5. **Single Server:** No load balancing or horizontal scaling

### Production Improvements

1. **MongoDB Transactions:** Wrap critical operations (booking, overlap checks)
2. **Redis Caching:** Cache availability computations with TTL
3. **Background Jobs:** Use Bull/Agenda for scheduled tasks (auto-transitions)
4. **API Rate Limiting:** Implement express-rate-limit
5. **Microservices:** Separate availability engine, notification service
6. **WebSockets:** Real-time appointment updates
7. **Database Sharding:** Partition by provider or date range
8. **CDN + Load Balancer:** Distribute frontend and API traffic

---

## 🐛 Edge Cases Handled

1. **Overlapping Appointments:** Double-booked provider/user prevented
2. **Exception Dates:** Holidays and blocked days respected
3. **Daily Limits:** Max appointments per day enforced
4. **Invalid State Transitions:** Blocked at API level
5. **Past Date Bookings:** Validation prevents booking in past
6. **Cancelled Slots:** Immediately available for rebooking
7. **Timezone Considerations:** All times stored in UTC (future enhancement)

---

## 📝 License

This project is created for educational purposes as part of a backend systems challenge.

---

## 👥 Contributing

This is an assignment project. For issues or suggestions, please contact the repository owner.

---

**Built with ❤️ using React, Node.js, and MongoDB**
