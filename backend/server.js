const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./Utils/dbConnect');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize email worker and reminder scheduler
require('./Workers/emailWorker');
const { startReminderScheduler } = require('./Workers/reminderScheduler');
startReminderScheduler();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const commonRoutes = require('./APIs/common');
const adminRoutes = require('./APIs/admin');
const providerRoutes = require('./APIs/provider');
const userRoutes = require('./APIs/user');

// API Routes
app.use('/api/auth', commonRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/user', userRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Harmony Booking Engine API is running' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
