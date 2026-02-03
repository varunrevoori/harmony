 const cron = require('node-cron');
const { queueReminder } = require('../Services/notificationService');
const Appointment = require('../Models/Appointment');
const User = require('../Models/User');
const Provider = require('../Models/Provider');

// Run every minute to check for appointments 1-2 hours ahead (for testing)
const startReminderScheduler = () => {
  // Schedule to run every minute for testing
  cron.schedule('* * * * *', async () => {
    console.log('Running appointment reminder scheduler...');
    
    try {
      const now = new Date();
      // Check appointments 1-2 hours from now (for quick testing)
      const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      console.log(`Checking for appointments between ${oneHourFromNow.toISOString()} and ${twoHoursFromNow.toISOString()}`);
      
      // Find appointments that are 1-2 hours away and haven't sent reminder
      const appointments = await Appointment.find({
        status: 'APPROVED',
        date: {
          $gte: oneHourFromNow,
          $lte: twoHoursFromNow
        },
        reminderSent: { $ne: true }
      })
      .populate('userId', 'name email')
      .populate('providerId', 'businessName userId')
      .lean();
      
      console.log(`Found ${appointments.length} appointments needing reminders`);
      
      // Process each appointment
      for (const appointment of appointments) {
        try {
          // Get provider's user details
          const providerUser = await User.findById(appointment.providerId.userId).select('email').lean();
          
          if (!providerUser) {
            console.error(`Provider user not found for appointment ${appointment.appointmentId}`);
            continue;
          }
          
          // Queue reminder email
          await queueReminder(
            appointment.appointmentId,
            appointment.userId.email,
            providerUser.email,
            {
              userName: appointment.userId.name,
              providerName: appointment.providerId.businessName,
              appointmentId: appointment.appointmentId,
              date: appointment.date,
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              location: appointment.serviceDetails?.location || 'TBD'
            }
          );
          
          // Mark reminder as sent
          await Appointment.findByIdAndUpdate(appointment._id, {
            reminderSent: true,
            reminderSentAt: new Date()
          });
          
          console.log(`Reminder queued for appointment ${appointment.appointmentId}`);
          
        } catch (error) {
          console.error(`Error processing reminder for appointment ${appointment.appointmentId}:`, error);
          // Continue with next appointment even if one fails
        }
      }
      
      console.log('Reminder scheduler completed');
      
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  });
  
  console.log('Appointment reminder scheduler started (runs every minute)');
};

// Manual trigger for testing (can be called via API endpoint)
const triggerManualReminder = async (appointmentId) => {
  try {
    const appointment = await Appointment.findOne({ appointmentId })
      .populate('userId', 'name email')
      .populate('providerId', 'businessName userId')
      .lean();
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    if (appointment.status !== 'APPROVED') {
      throw new Error('Only approved appointments can have reminders');
    }
    
    const providerUser = await User.findById(appointment.providerId.userId).select('email').lean();
    
    await queueReminder(
      appointment.appointmentId,
      appointment.userId.email,
      providerUser.email,
      {
        userName: appointment.userId.name,
        providerName: appointment.providerId.businessName,
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        location: appointment.serviceDetails?.location || 'TBD'
      }
    );
    
    await Appointment.findByIdAndUpdate(appointment._id, {
      reminderSent: true,
      reminderSentAt: new Date()
    });
    
    console.log(`Manual reminder sent for appointment ${appointmentId}`);
    return { success: true, message: 'Reminder sent successfully' };
    
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    throw error;
  }
};

module.exports = {
  startReminderScheduler,
  triggerManualReminder
};
