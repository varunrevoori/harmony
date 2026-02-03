// Run this script to create an admin user: node createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createAdmin = async () => {
  await connectDB();

  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@harmony.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create new admin
    const admin = new User({
      name: 'System Admin',
      email: 'admin@harmony.com',
      password: 'Admin@123',  // Will be hashed automatically by the model
      phone: '1234567890',
      role: 'SYSTEM_ADMIN',
      isApproved: true,
      isActive: true
    });

    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email: admin@harmony.com');
    console.log('Password: Admin@123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
