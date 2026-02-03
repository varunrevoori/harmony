const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../Middlewares/auth');
const roleCheck = require('../Middlewares/roleCheck');
const { auditLog } = require('../Middlewares/auditLog');
const Provider = require('../Models/Provider');
const AvailabilityRule = require('../Models/AvailabilityRule');
const Appointment = require('../Models/Appointment');
const User = require('../Models/User');
const { validateTransition } = require('../Utils/stateManager');
const { queueNotification } = require('../Services/notificationService');

// All provider routes require authentication and SERVICE_PROVIDER role
router.use(auth);
router.use(roleCheck('SERVICE_PROVIDER'));

/**
 * @route   GET /api/provider/profile
 * @desc    Get provider profile
 * @access  Provider only
 */
router.get('/profile', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.userId });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { provider }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/provider/profile
 * @desc    Update provider profile
 * @access  Provider only
 */
router.put('/profile', auditLog('PROVIDER_UPDATED', 'PROVIDER'), async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'businessName', 'description', 'specializations', 'pricing',
      'location', 'slotDuration', 'maxAppointmentsPerDay', 'certifications'
    ];
    
    const provider = await Provider.findOne({ userId: req.userId });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }
    
    // Update only allowed fields
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        provider[key] = updates[key];
      }
    });
    
    await provider.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { provider }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/provider/availability
 * @desc    Create availability rule
 * @access  Provider only
 */
router.post('/availability', [
  body('dayOfWeek').isIn(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  body('timeSlots').isArray({ min: 1 }).withMessage('At least one time slot required'),
  auditLog('AVAILABILITY_CREATED', 'AVAILABILITY_RULE')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const provider = await Provider.findOne({ userId: req.userId });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }
    
    const { dayOfWeek, timeSlots, exceptionDates } = req.body;
    
    // Check if rule already exists
    const existing = await AvailabilityRule.findOne({
      providerId: provider._id,
      dayOfWeek: dayOfWeek
    });
    
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Availability rule already exists for this day. Use PUT to update.'
      });
    }
    
    const availabilityRule = new AvailabilityRule({
      providerId: provider._id,
      dayOfWeek,
      timeSlots,
      exceptionDates: exceptionDates || []
    });
    
    await availabilityRule.save();
    
    res.status(201).json({
      success: true,
      message: 'Availability rule created',
      data: { availabilityRule }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating availability rule',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/provider/availability
 * @desc    Get all availability rules
 * @access  Provider only
 */
router.get('/availability', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.userId });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }
    
    const rules = await AvailabilityRule.find({ providerId: provider._id });
    
    res.status(200).json({
      success: true,
      data: { rules }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching availability rules',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/provider/availability/:id
 * @desc    Update availability rule
 * @access  Provider only
 */
router.put('/availability/:id', auditLog('AVAILABILITY_UPDATED', 'AVAILABILITY_RULE'), async (req, res) => {
  try {
    console.log('PUT /availability/:id - Request received');
    console.log('User ID:', req.userId);
    console.log('Availability ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const provider = await Provider.findOne({ userId: req.userId });
    
    if (!provider) {
      console.log('Provider not found for userId:', req.userId);
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }
    
    console.log('Provider found:', provider._id);
    
    const rule = await AvailabilityRule.findById(req.params.id);
    
    if (!rule) {
      console.log('Availability rule not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Availability rule not found'
      });
    }
    
    console.log('Rule found, providerId:', rule.providerId);
    
    if (rule.providerId.toString() !== provider._id.toString()) {
      console.log('Provider mismatch');
      return res.status(404).json({
        success: false,
        message: 'Availability rule not found'
      });
    }
    
    const { timeSlots, exceptionDates, isActive } = req.body;
    
    if (timeSlots) rule.timeSlots = timeSlots;
    if (exceptionDates) rule.exceptionDates = exceptionDates;
    if (isActive !== undefined) rule.isActive = isActive;
    
    console.log('Saving rule with timeSlots:', rule.timeSlots);
    
    await rule.save();
    
    console.log('Rule saved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Availability rule updated',
      data: { rule }
    });
  } catch (error) {
    console.error('Error updating availability rule:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating availability rule',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/provider/appointments
 * @desc    Get provider appointments with filters
 * @access  Provider only
 */
router.get('/appointments', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.userId });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }
    
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = { providerId: provider._id };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('userId', 'name email phone')
        .sort({ date: 1, startTime: 1 })
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
 * @route   PUT /api/provider/appointments/:id/status
 * @desc    Update appointment status (approve/reject/complete)
 * @access  Provider only
 */
router.put('/appointments/:id/status', auditLog('APPOINTMENT_UPDATED', 'APPOINTMENT'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const provider = await Provider.findOne({ userId: req.userId });
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment || appointment.providerId.toString() !== provider._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Validate transition
    const validation = validateTransition(appointment.status, status, req.userRole);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    // Update status
    appointment.updateStatus(status, req.userId, reason || '');
    await appointment.save();
    
    // Update provider statistics
    if (status === 'COMPLETED') {
      provider.completedAppointments += 1;
    } else if (status === 'CANCELLED') {
      provider.cancelledAppointments += 1;
    }
    await provider.save();
    
    // Send notification emails based on status change
    const user = await User.findById(appointment.userId).select('email name');
    
    try {
      if (status === 'APPROVED') {
        await queueNotification('APPOINTMENT_APPROVED', user.email, {
          userName: user.name,
          providerName: provider.businessName,
          appointmentId: appointment.appointmentId,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: provider.location?.address || 'TBD'
        });
      } else if (status === 'REJECTED') {
        await queueNotification('APPOINTMENT_REJECTED', user.email, {
          userName: user.name,
          providerName: provider.businessName,
          appointmentId: appointment.appointmentId,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          reason: reason || 'No reason provided'
        });
      } else if (status === 'COMPLETED') {
        await queueNotification('APPOINTMENT_COMPLETED', user.email, {
          userName: user.name,
          providerName: provider.businessName,
          appointmentId: appointment.appointmentId,
          date: appointment.date,
          serviceName: appointment.serviceDetails?.serviceName || provider.businessName
        });
      }
    } catch (emailError) {
      console.error('Error sending status change notification:', emailError);
      // Don't fail the status update if email fails
    }
    
    res.status(200).json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: { appointment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/provider/stats
 * @desc    Get provider statistics
 * @access  Provider only
 */
router.get('/stats', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.userId });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }
    
    const stats = {
      totalAppointments: provider.totalAppointments,
      completedAppointments: provider.completedAppointments,
      cancelledAppointments: provider.cancelledAppointments,
      utilizationRate: provider.utilizationRate,
      rating: provider.rating
    };
    
    // Get pending appointments count
    stats.pendingAppointments = await Appointment.countDocuments({
      providerId: provider._id,
      status: 'REQUESTED'
    });
    
    // Get upcoming appointments count
    stats.upcomingAppointments = await Appointment.countDocuments({
      providerId: provider._id,
      status: 'APPROVED',
      date: { $gte: new Date() }
    });
    
    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
