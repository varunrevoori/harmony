// Quick test script to debug availability computation
require('dotenv').config();
const mongoose = require('mongoose');
const { computeAvailableSlots, getDayOfWeek } = require('./Utils/availabilityCompute');
const Provider = require('./Models/Provider');
const AvailabilityRule = require('./Models/AvailabilityRule');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testAvailability = async () => {
  await connectDB();

  try {
    // Get first provider
    const provider = await Provider.findOne();
    if (!provider) {
      console.log('❌ No provider found. Create a provider first.');
      process.exit(1);
    }

    console.log('=== TESTING PROVIDER ===');
    console.log(`Business Name: ${provider.businessName}`);
    console.log(`Provider ID: ${provider._id}`);
    console.log(`Slot Duration: ${provider.slotDuration || 60}\n`);

    // Get their availability rules
    const rules = await AvailabilityRule.find({ providerId: provider._id, isActive: true });
    console.log('=== AVAILABILITY RULES ===');
    if (rules.length === 0) {
      console.log('❌ No active availability rules found!\n');
    } else {
      rules.forEach(rule => {
        console.log(`${rule.dayOfWeek}:`);
        rule.timeSlots.forEach(slot => {
          console.log(`  ${slot.startTime} - ${slot.endTime}`);
        });
      });
      console.log('');
    }

    // Test with different dates
    const testDates = [
      '2026-02-03', // Tuesday
      '2026-02-04', // Wednesday  
      '2026-02-05', // Thursday
      '2026-02-06', // Friday
      '2026-02-07', // Saturday
    ];

    console.log('=== TESTING DATES ===');
    for (const dateStr of testDates) {
      const testDate = new Date(dateStr);
      const dayOfWeek = getDayOfWeek(testDate);
      
      console.log(`\nDate: ${dateStr} (${dayOfWeek})`);
      
      const result = await computeAvailableSlots(
        provider._id,
        testDate,
        provider.slotDuration || 60
      );
      
      console.log(`  Total Slots: ${result.totalSlots || 0}`);
      console.log(`  Available: ${result.availableSlots?.length || 0}`);
      console.log(`  Message: ${result.message}`);
      
      if (result.availableSlots && result.availableSlots.length > 0) {
        console.log('  Sample slots:', result.availableSlots.slice(0, 3).map(s => `${s.startTime}-${s.endTime}`).join(', '));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testAvailability();
