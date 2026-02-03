const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action type is required'],
    enum: {
      values: [
        'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_LOGIN', 'USER_LOGOUT',
        'PROVIDER_CREATED', 'PROVIDER_UPDATED', 'PROVIDER_APPROVED', 'PROVIDER_REJECTED',
        'APPOINTMENT_CREATED', 'APPOINTMENT_UPDATED', 'APPOINTMENT_CANCELLED', 
        'APPOINTMENT_APPROVED', 'APPOINTMENT_REJECTED', 'APPOINTMENT_COMPLETED',
        'AVAILABILITY_CREATED', 'AVAILABILITY_UPDATED', 'AVAILABILITY_DELETED',
        'SYSTEM_CONFIG_UPDATED', 'PASSWORD_CHANGED', 'ROLE_CHANGED'
      ],
      message: '{VALUE} is not a valid action type'
    }
  },
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: String,
    role: String
  },
  entity: {
    type: {
      type: String,
      required: true,
      enum: ['USER', 'PROVIDER', 'APPOINTMENT', 'AVAILABILITY_RULE', 'SYSTEM']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  changes: {
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    method: String,
    endpoint: String,
    statusCode: Number,
    errorMessage: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // Using custom timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ 'entity.type': 1, 'entity.id': 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Static method to create audit log
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - audit logs shouldn't break main operations
    return null;
  }
};

// Static method to get logs for an entity
auditLogSchema.statics.getEntityLogs = async function(entityType, entityId, limit = 50) {
  return this.find({
    'entity.type': entityType,
    'entity.id': entityId
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('actor.userId', 'name email');
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, startDate, endDate) {
  const query = {
    'actor.userId': userId
  };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .select('-__v');
};

// Static method to get system-wide logs with filters
auditLogSchema.statics.getSystemLogs = async function(filters = {}, page = 1, limit = 50) {
  const query = {};
  
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query['entity.type'] = filters.entityType;
  if (filters.userId) query['actor.userId'] = filters.userId;
  
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor.userId', 'name email role'),
    this.countDocuments(query)
  ]);
  
  return {
    logs,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
