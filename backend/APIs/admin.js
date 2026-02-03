const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth');
const roleCheck = require('../Middlewares/roleCheck');
const { auditLog } = require('../Middlewares/auditLog');
const User = require('../Models/User');
const Provider = require('../Models/Provider');
const Appointment = require('../Models/Appointment');
const AuditLog = require('../Models/AuditLog');
const { queueNotification } = require('../Services/notificationService');

// All admin routes require authentication and SYSTEM_ADMIN role
router.use(auth);
router.use(roleCheck('SYSTEM_ADMIN'));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters and pagination
 * @access  Admin only
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        users,
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
      message: 'Error fetching users',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/providers/pending
 * @desc    Get pending provider approvals
 * @access  Admin only
 */
router.get('/providers/pending', async (req, res) => {
  try {
    const pendingProviders = await User.find({
      role: 'SERVICE_PROVIDER',
      isApproved: false
    })
      .select('-password')
      .populate({
        path: 'providerProfile',
        model: 'Provider'
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: { providers: pendingProviders }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending providers',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/providers/:userId/approve
 * @desc    Approve a provider
 * @access  Admin only
 */
router.put('/providers/:userId/approve', auditLog('PROVIDER_APPROVED', 'PROVIDER'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'SERVICE_PROVIDER') {
      return res.status(400).json({
        success: false,
        message: 'User is not a service provider'
      });
    }
    
    user.isApproved = true;
    await user.save();
    
    // Get provider details for email
    const provider = await Provider.findOne({ userId: user._id });
    
    // Send approval notification
    try {
      await queueNotification('PROVIDER_APPROVED', user.email, {
        providerName: user.name,
        businessName: provider?.businessName || 'Your Business',
        serviceType: provider?.serviceType || 'Service'
      });
    } catch (emailError) {
      console.error('Error sending provider approval email:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Provider approved successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving provider',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/providers/:userId/reject
 * @desc    Reject a provider
 * @access  Admin only
 */
router.put('/providers/:userId/reject', auditLog('PROVIDER_REJECTED', 'PROVIDER'), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = false;
    await user.save();
    
    // Send rejection notification
    try {
      await queueNotification('PROVIDER_REJECTED', user.email, {
        providerName: user.name,
        reason: reason || 'Your application did not meet our requirements at this time'
      });
    } catch (emailError) {
      console.error('Error sending provider rejection email:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Provider rejected',
      data: { user, reason }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting provider',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get system audit logs with filters
 * @access  Admin only
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType, startDate, endDate } = req.query;
    
    const filters = {};
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (startDate || endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    
    const result = await AuditLog.getSystemLogs(filters, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/analytics/provider-utilization
 * @desc    Get provider utilization statistics
 * @access  Admin only
 */
router.get('/analytics/provider-utilization', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    
    const utilization = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$providerId',
          totalAppointments: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'providers',
          localField: '_id',
          foreignField: '_id',
          as: 'provider'
        }
      },
      { $unwind: '$provider' },
      {
        $project: {
          providerId: '$_id',
          businessName: '$provider.businessName',
          totalAppointments: 1,
          completed: 1,
          cancelled: 1,
          utilizationRate: {
            $cond: [
              { $eq: ['$totalAppointments', 0] },
              0,
              { $multiply: [{ $divide: ['$completed', '$totalAppointments'] }, 100] }
            ]
          }
        }
      },
      { $sort: { utilizationRate: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: { utilization }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider utilization',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/analytics/cancellation-ranking
 * @desc    Get users with highest cancellations
 * @access  Admin only
 */
router.get('/analytics/cancellation-ranking', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const rankings = await Appointment.aggregate([
      { $match: { status: 'CANCELLED' } },
      {
        $group: {
          _id: '$userId',
          cancellationCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          cancellationCount: 1
        }
      },
      { $sort: { cancellationCount: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.status(200).json({
      success: true,
      data: { rankings }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cancellation rankings',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deactivate/Delete user
 * @access  Admin only
 */
router.delete('/users/:id', auditLog('USER_DELETED', 'USER'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = false;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;
