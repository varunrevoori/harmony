const AuditLog = require('../Models/AuditLog');

/**
 * Audit Logging Middleware
 * Automatically logs significant actions
 */
const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to capture response
    res.send = function(data) {
      res.send = originalSend; // Restore original send
      
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Create audit log asynchronously (don't wait)
        createAuditLog(req, res, action, entityType).catch(err => {
          console.error('Error creating audit log:', err);
        });
      }
      
      return res.send(data);
    };
    
    next();
  };
};

/**
 * Helper function to create audit log entry
 */
async function createAuditLog(req, res, action, entityType) {
  try {
    const logData = {
      action: action,
      actor: {
        userId: req.userId || null,
        email: req.user?.email || 'anonymous',
        role: req.userRole || 'guest'
      },
      entity: {
        type: entityType,
        id: req.body?._id || req.params?.id || req.body?.userId || req.body?.providerId || req.userId
      },
      changes: {
        oldValue: req.oldValue || null,
        newValue: req.newValue || null
      },
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode
      },
      timestamp: new Date()
    };
    
    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Audit log creation failed:', error);
    // Don't throw - audit failures shouldn't break the main operation
  }
}

/**
 * Manual audit log creation (for use in route handlers)
 */
const createManualLog = async (userId, action, entityType, entityId, changes = {}, metadata = {}) => {
  try {
    const logData = {
      action: action,
      actor: {
        userId: userId,
        email: changes.email || '',
        role: changes.role || ''
      },
      entity: {
        type: entityType,
        id: entityId
      },
      changes: {
        oldValue: changes.oldValue || null,
        newValue: changes.newValue || null
      },
      metadata: metadata,
      timestamp: new Date()
    };
    
    return await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Manual audit log failed:', error);
    return null;
  }
};

module.exports = { auditLog, createManualLog };
