const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider is required']
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format']
  },
  status: {
    type: String,
    enum: {
      values: ['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED', 'RESCHEDULED'],
      message: '{VALUE} is not a valid status'
    },
    default: 'REQUESTED'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  serviceDetails: {
    serviceName: String,
    price: Number,
    duration: Number
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED', 'RESCHEDULED']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  rescheduleHistory: [{
    previousDate: {
      type: Date,
      required: true
    },
    previousStartTime: {
      type: String,
      required: true
    },
    previousEndTime: {
      type: String,
      required: true
    },
    newDate: {
      type: Date,
      required: true
    },
    newStartTime: {
      type: String,
      required: true
    },
    newEndTime: {
      type: String,
      required: true
    },
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rescheduledAt: {
      type: Date,
      default: Date.now
    },
    reason: String,
    isLateReschedule: {
      type: Boolean,
      default: false
    }
  }],
  rescheduleCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rescheduleLimit: {
    type: Number,
    default: 2,
    min: 0
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent overlapping appointments
appointmentSchema.index({ providerId: 1, date: 1, startTime: 1 });
appointmentSchema.index({ userId: 1, date: 1, startTime: 1 });
appointmentSchema.index({ status: 1, date: 1 });

// Generate unique appointment ID before saving
appointmentSchema.pre('validate', function(next) {
  if (!this.appointmentId) {
    this.appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Valid state transitions
const VALID_TRANSITIONS = {
  'REQUESTED': ['APPROVED', 'REJECTED', 'CANCELLED'],
  'APPROVED': ['IN_PROGRESS', 'CANCELLED', 'COMPLETED', 'RESCHEDULED'],
  'REJECTED': [],
  'CANCELLED': [],
  'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': [],
  'RESCHEDULED': ['APPROVED', 'REQUESTED']
};

// Validate state transitions
appointmentSchema.methods.canTransitionTo = function(newStatus) {
  const allowedTransitions = VALID_TRANSITIONS[this.status] || [];
  return allowedTransitions.includes(newStatus);
};

// Update status with validation
appointmentSchema.methods.updateStatus = function(newStatus, changedBy, reason = '') {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    changedBy: changedBy,
    changedAt: new Date(),
    reason: reason
  });
  
  this.status = newStatus;
  
  // Store reason if applicable
  if (newStatus === 'CANCELLED' && reason) {
    this.cancellationReason = reason;
  } else if (newStatus === 'REJECTED' && reason) {
    this.rejectionReason = reason;
  }
};

// Check if appointment can be rescheduled
appointmentSchema.methods.canReschedule = function() {
  // Only APPROVED appointments can be rescheduled
  if (this.status !== 'APPROVED') {
    return {
      allowed: false,
      reason: 'Only approved appointments can be rescheduled'
    };
  }
  
  // Check reschedule limit
  if (this.rescheduleCount >= this.rescheduleLimit) {
    return {
      allowed: false,
      reason: `Maximum reschedule limit (${this.rescheduleLimit}) reached`
    };
  }
  
  // Check if appointment is in the past
  const appointmentDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}`);
  if (appointmentDateTime < new Date()) {
    return {
      allowed: false,
      reason: 'Cannot reschedule past appointments'
    };
  }
  
  return {
    allowed: true,
    remainingReschedules: this.rescheduleLimit - this.rescheduleCount
  };
};

// Check if reschedule is late (less than 24 hours before appointment)
appointmentSchema.methods.isLateReschedule = function() {
  const appointmentDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}`);
  const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return appointmentDateTime < twentyFourHoursFromNow;
};

// Check for overlapping appointments (static method)
appointmentSchema.statics.checkOverlap = async function(providerId, userId, date, startTime, endTime, excludeId = null) {
  const query = {
    date: date,
    status: { $in: ['REQUESTED', 'APPROVED', 'IN_PROGRESS'] },
    $or: [
      // Provider overlap
      {
        providerId: providerId,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      },
      // User overlap
      {
        userId: userId,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlapping = await this.findOne(query);
  return overlapping !== null;
};

// Check daily appointment limits
appointmentSchema.statics.checkDailyLimits = async function(providerId, userId, date, maxProviderLimit, maxUserLimit) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Check provider limit
  const providerCount = await this.countDocuments({
    providerId: providerId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['REQUESTED', 'APPROVED', 'IN_PROGRESS'] }
  });
  
  if (providerCount >= maxProviderLimit) {
    throw new Error('Provider has reached maximum appointments for this day');
  }
  
  // Check user limit
  const userCount = await this.countDocuments({
    userId: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['REQUESTED', 'APPROVED', 'IN_PROGRESS'] }
  });
  
  if (userCount >= maxUserLimit) {
    throw new Error('User has reached maximum appointments for this day');
  }
  
  return true;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
