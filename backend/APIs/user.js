const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../Middlewares/auth');
const roleCheck = require('../Middlewares/roleCheck');
const { auditLog } = require('../Middlewares/auditLog');
const Provider = require('../Models/Provider');
const Appointment = require('../Models/Appointment');
const User = require('../Models/User');
const { computeAvailableSlots, validateSlotAvailability } = require('../Utils/availabilityCompute');
const { validateTransition } = require('../Utils/stateManager');
const { queueNotification } = require('../Services/notificationService');

// All user routes require authentication and END_USER role
router.use(auth);
router.use(roleCheck('END_USER'));

/**
 * @route   GET /api/user/providers
 * @desc    Browse and search providers
 * @access  User only
 */
router.get('/providers', async (req, res) => {
  try {
    const { serviceType, city, minRating, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Build query
    if (serviceType) query.serviceType = serviceType;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (minRating) query['rating.average'] = { $gte: parseFloat(minRating) };
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { specializations: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Only show approved providers
    const approvedUserIds = await User.find({
      role: 'SERVICE_PROVIDER',
      isApproved: true,
      isActive: true
    }).distinct('_id');
    
    query.userId = { $in: approvedUserIds };
    
    const skip = (page - 1) * limit;
    
    const [providers, total] = await Promise.all([
      Provider.find(query)
        .populate('userId', 'name email phone')
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Provider.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        providers,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching providers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/user/providers/:id
 * @desc    Get provider details
 * @access  User only
 */
router.get('/providers/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('userId', 'name email phone');
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { provider }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider details',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/user/availability/:providerId
 * @desc    Get available slots for a provider on a specific date
 * @access  User only
 */
router.get('/availability/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date query parameter is required'
      });
    }
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    const availability = await computeAvailableSlots(
      provider._id,
      new Date(date),
      provider.slotDuration || 60
    );
    
    res.status(200).json({
      success: true,
      data: { 
        availableSlots: availability.availableSlots || [],
        message: availability.message,
        dayOfWeek: availability.dayOfWeek,
        totalSlots: availability.totalSlots,
        bookedSlots: availability.bookedSlots
      }
    });
  } catch (error) {
    console.error('Error computing availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error computing availability',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/user/compute-availability
 * @desc    Compute available slots for a provider
 * @access  User only
 */
router.post('/compute-availability', [
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { providerId, date } = req.body;
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    const availability = await computeAvailableSlots(
      provider._id,
      new Date(date),
      provider.slotDuration
    );
    
    console.log('Availability computed:', {
      date,
      dayOfWeek: availability.dayOfWeek,
      totalSlots: availability.totalSlots,
      availableSlots: availability.availableSlots?.length || 0
    });
    
    res.status(200).json({
      success: true,
      data: { 
        availableSlots: availability.availableSlots || [],
        message: availability.message,
        dayOfWeek: availability.dayOfWeek,
        totalSlots: availability.totalSlots,
        bookedSlots: availability.bookedSlots
      }
    });
  } catch (error) {
    console.error('Error computing availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error computing availability',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/user/appointment
 * @desc    Book an appointment
 * @access  User only
 */
router.post('/appointment', [
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required (HH:mm)'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required (HH:mm)'),
  auditLog('APPOINTMENT_CREATED', 'APPOINTMENT')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { providerId, date, startTime, endTime, notes } = req.body;
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    const user = await User.findById(req.userId);
    
    // Step 1: Validate slot availability
    const slotValidation = await validateSlotAvailability(
      provider._id,
      new Date(date),
      startTime,
      endTime
    );
    
    if (!slotValidation.available) {
      return res.status(400).json({
        success: false,
        message: slotValidation.reason
      });
    }
    
    // Step 2: Check for overlapping appointments
    const hasOverlap = await Appointment.checkOverlap(
      provider._id,
      req.userId,
      new Date(date),
      startTime,
      endTime
    );
    
    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing appointment'
      });
    }
    
    // Step 3: Check daily limits
    try {
      await Appointment.checkDailyLimits(
        provider._id,
        req.userId,
        new Date(date),
        provider.maxAppointmentsPerDay || 10,
        user.maxAppointmentsPerDay || 5
      );
    } catch (limitError) {
      return res.status(400).json({
        success: false,
        message: limitError.message
      });
    }
    
    // Step 4: Create appointment
    const appointment = new Appointment({
      userId: req.userId,
      providerId: provider._id,
      date: new Date(date),
      startTime,
      endTime,
      status: 'REQUESTED',
      notes: notes || '',
      serviceDetails: {
        serviceName: provider.businessName,
        price: provider.pricing.basePrice,
        duration: provider.slotDuration
      }
    });
    
    // Add initial status to history
    appointment.statusHistory.push({
      status: 'REQUESTED',
      changedBy: req.userId,
      changedAt: new Date(),
      reason: 'Appointment requested by user'
    });
    
    await appointment.save();
    
    // Update provider stats
    provider.totalAppointments += 1;
    await provider.save();
    
    // Get provider user email for notification
    const providerUser = await User.findById(provider.userId).select('email name');
    
    // Send booking confirmation email to user
    try {
      await queueNotification('BOOKING_CONFIRMATION', user.email, {
        userName: user.name,
        providerName: provider.businessName,
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        serviceName: provider.businessName,
        price: provider.pricing.basePrice
      });
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError);
      // Don't fail the booking if email fails
    }
    
    // Send new appointment request notification to provider
    try {
      await queueNotification('NEW_APPOINTMENT_REQUEST', providerUser.email, {
        providerName: provider.businessName,
        userName: user.name,
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        serviceName: provider.businessName,
        notes: notes || 'No additional notes'
      });
    } catch (emailError) {
      console.error('Error sending provider notification email:', emailError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Appointment requested successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/user/appointments
 * @desc    Get user's appointments
 * @access  User only
 */
router.get('/appointments', async (req, res) => {
  try {
    const { status, upcoming, page = 1, limit = 20 } = req.query;
    
    const query = { userId: req.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = { $in: ['REQUESTED', 'APPROVED', 'IN_PROGRESS'] };
    }
    
    const skip = (page - 1) * limit;
    
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('providerId')
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/user/appointments/:id
 * @desc    Get appointment details
 * @access  User only
 */
router.get('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId
    })
      .populate('providerId')
      .populate('userId', 'name email phone');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/user/appointments/:id/cancel
 * @desc    Cancel an appointment
 * @access  User only
 */
router.put('/appointments/:id/cancel', [
  body('reason').optional(),
  auditLog('APPOINTMENT_CANCELLED', 'APPOINTMENT')
], async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Validate transition
    const validation = validateTransition(appointment.status, 'CANCELLED', req.userRole);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    // Update status
    appointment.updateStatus('CANCELLED', req.userId, reason || 'Cancelled by user');
    await appointment.save();
    
    // Update provider stats
    const provider = await Provider.findById(appointment.providerId).populate('userId', 'email name');
    if (provider) {
      provider.cancelledAppointments += 1;
      await provider.save();
      
      // Send cancellation notification to provider
      try {
        await queueNotification('APPOINTMENT_CANCELLED', provider.userId.email, {
          recipientName: provider.businessName,
          appointmentId: appointment.appointmentId,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          reason: reason || 'No reason provided',
          cancelledBy: 'User'
        });
      } catch (emailError) {
        console.error('Error sending cancellation notification:', emailError);
      }
    }
    
    // Send cancellation confirmation to user
    const user = await User.findById(req.userId).select('email name');
    try {
      await queueNotification('APPOINTMENT_CANCELLED', user.email, {
        recipientName: user.name,
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        reason: reason || 'No reason provided',
        cancelledBy: 'You'
      });
    } catch (emailError) {
      console.error('Error sending cancellation confirmation:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/user/appointments/:id/reschedule
 * @desc    Reschedule an approved appointment
 * @access  User only
 */
router.put('/appointments/:id/reschedule', [
  body('newDate').isISO8601().withMessage('Valid new date is required'),
  body('newStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid new start time required (HH:mm)'),
  body('newEndTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid new end time required (HH:mm)'),
  body('reason').optional(),
  auditLog('APPOINTMENT_RESCHEDULED', 'APPOINTMENT')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { newDate, newStartTime, newEndTime, reason } = req.body;
    
    // Find appointment
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment can be rescheduled
    const rescheduleCheck = appointment.canReschedule();
    if (!rescheduleCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: rescheduleCheck.reason
      });
    }
    
    // Check if this is a late reschedule
    const isLate = appointment.isLateReschedule();
    
    // Get provider details
    const provider = await Provider.findById(appointment.providerId).populate('userId', 'email name');
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    // Validate new slot availability
    const slotValidation = await validateSlotAvailability(
      provider._id,
      new Date(newDate),
      newStartTime,
      newEndTime
    );
    
    if (!slotValidation.available) {
      return res.status(400).json({
        success: false,
        message: slotValidation.reason
      });
    }
    
    // Check for overlapping appointments (exclude current appointment)
    const hasOverlap = await Appointment.checkOverlap(
      provider._id,
      req.userId,
      new Date(newDate),
      newStartTime,
      newEndTime,
      appointment._id
    );
    
    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        message: 'New time slot conflicts with existing appointment'
      });
    }
    
    // Store previous appointment details
    const previousDate = appointment.date;
    const previousStartTime = appointment.startTime;
    const previousEndTime = appointment.endTime;
    
    // Update appointment to RESCHEDULED status first
    appointment.updateStatus('RESCHEDULED', req.userId, reason || 'Rescheduled by user');
    
    // Add to reschedule history
    appointment.rescheduleHistory.push({
      previousDate: previousDate,
      previousStartTime: previousStartTime,
      previousEndTime: previousEndTime,
      newDate: new Date(newDate),
      newStartTime: newStartTime,
      newEndTime: newEndTime,
      rescheduledBy: req.userId,
      rescheduledAt: new Date(),
      reason: reason || 'No reason provided',
      isLateReschedule: isLate
    });
    
    // Increment reschedule count
    appointment.rescheduleCount += 1;
    
    // Update appointment with new details
    appointment.date = new Date(newDate);
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    
    // Reset reminder flag since date/time changed
    appointment.reminderSent = false;
    appointment.reminderSentAt = null;
    
    // Transition back to APPROVED (or REQUESTED if late reschedule and provider requires approval)
    const newStatus = isLate && provider.requireApprovalForLateReschedule ? 'REQUESTED' : 'APPROVED';
    appointment.updateStatus(newStatus, req.userId, isLate ? 'Late reschedule - requires re-approval' : 'Rescheduled and approved');
    
    await appointment.save();
    
    // Get user details
    const user = await User.findById(req.userId).select('email name');
    
    // Send reschedule notification to user
    try {
      await queueNotification('APPOINTMENT_RESCHEDULED', user.email, {
        recipientName: user.name,
        appointmentId: appointment.appointmentId,
        previousDate: previousDate,
        previousStartTime: previousStartTime,
        previousEndTime: previousEndTime,
        newDate: new Date(newDate),
        newStartTime: newStartTime,
        newEndTime: newEndTime,
        reason: reason || 'No reason provided',
        rescheduledBy: 'You',
        isLateReschedule: isLate
      });
    } catch (emailError) {
      console.error('Error sending reschedule notification to user:', emailError);
    }
    
    // Send reschedule notification to provider
    try {
      await queueNotification('APPOINTMENT_RESCHEDULED', provider.userId.email, {
        recipientName: provider.businessName,
        appointmentId: appointment.appointmentId,
        previousDate: previousDate,
        previousStartTime: previousStartTime,
        previousEndTime: previousEndTime,
        newDate: new Date(newDate),
        newStartTime: newStartTime,
        newEndTime: newEndTime,
        reason: reason || 'No reason provided',
        rescheduledBy: user.name,
        isLateReschedule: isLate
      });
    } catch (emailError) {
      console.error('Error sending reschedule notification to provider:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: `Appointment rescheduled successfully${isLate ? ' (late reschedule - may require provider re-approval)' : ''}`,
      data: {
        appointment,
        remainingReschedules: rescheduleCheck.remainingReschedules - 1,
        isLateReschedule: isLate
      }
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error rescheduling appointment',
      error: error.message
    });
  }
});

module.exports = router;
