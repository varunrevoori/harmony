/**
 * State Manager for Appointment Lifecycle
 * Enforces strict state transitions and business rules
 */

// Valid state transitions mapping
const VALID_TRANSITIONS = {
  'REQUESTED': ['APPROVED', 'REJECTED', 'CANCELLED'],
  'APPROVED': ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
  'REJECTED': [], // Terminal state
  'CANCELLED': [], // Terminal state
  'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': [] // Terminal state
};

// States that can be changed by users
const USER_ALLOWED_TRANSITIONS = {
  'REQUESTED': ['CANCELLED'], // User can cancel requested appointment
  'APPROVED': ['CANCELLED']   // User can cancel approved appointment
};

// States that can be changed by providers
const PROVIDER_ALLOWED_TRANSITIONS = {
  'REQUESTED': ['APPROVED', 'REJECTED'],
  'APPROVED': ['IN_PROGRESS', 'CANCELLED'],
  'IN_PROGRESS': ['COMPLETED']
};

// States that can be changed by system/admin
const ADMIN_ALLOWED_TRANSITIONS = {
  'REQUESTED': ['APPROVED', 'REJECTED', 'CANCELLED'],
  'APPROVED': ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
  'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
  'REJECTED': [],
  'CANCELLED': [],
  'COMPLETED': []
};

/**
 * Check if transition is valid
 */
const isValidTransition = (currentStatus, newStatus) => {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Check if user can perform this transition
 */
const canUserTransition = (currentStatus, newStatus) => {
  const allowedTransitions = USER_ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Check if provider can perform this transition
 */
const canProviderTransition = (currentStatus, newStatus) => {
  const allowedTransitions = PROVIDER_ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Check if admin can perform this transition
 */
const canAdminTransition = (currentStatus, newStatus) => {
  const allowedTransitions = ADMIN_ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Validate transition based on role
 */
const validateTransition = (currentStatus, newStatus, userRole) => {
  // First check if transition is valid at all
  if (!isValidTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      message: `Invalid transition from ${currentStatus} to ${newStatus}`
    };
  }
  
  // Check role-based permissions
  let hasPermission = false;
  
  switch (userRole) {
    case 'END_USER':
      hasPermission = canUserTransition(currentStatus, newStatus);
      break;
    case 'SERVICE_PROVIDER':
      hasPermission = canProviderTransition(currentStatus, newStatus);
      break;
    case 'SYSTEM_ADMIN':
      hasPermission = canAdminTransition(currentStatus, newStatus);
      break;
    default:
      hasPermission = false;
  }
  
  if (!hasPermission) {
    return {
      valid: false,
      message: `User with role ${userRole} cannot transition from ${currentStatus} to ${newStatus}`
    };
  }
  
  return {
    valid: true,
    message: 'Transition is valid'
  };
};

/**
 * Get allowed transitions for a status and role
 */
const getAllowedTransitions = (currentStatus, userRole) => {
  let allowedTransitions = [];
  
  switch (userRole) {
    case 'END_USER':
      allowedTransitions = USER_ALLOWED_TRANSITIONS[currentStatus] || [];
      break;
    case 'SERVICE_PROVIDER':
      allowedTransitions = PROVIDER_ALLOWED_TRANSITIONS[currentStatus] || [];
      break;
    case 'SYSTEM_ADMIN':
      allowedTransitions = ADMIN_ALLOWED_TRANSITIONS[currentStatus] || [];
      break;
  }
  
  return allowedTransitions;
};

/**
 * Check if status is terminal (no further transitions possible)
 */
const isTerminalStatus = (status) => {
  const transitions = VALID_TRANSITIONS[status] || [];
  return transitions.length === 0;
};

/**
 * Auto-transition logic based on time
 * (Can be used in scheduled jobs)
 */
const getAutoTransitionStatus = (appointment) => {
  const now = new Date();
  const appointmentDate = new Date(appointment.date);
  const [hours, minutes] = appointment.startTime.split(':').map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);
  
  const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
  const appointmentEndDate = new Date(appointment.date);
  appointmentEndDate.setHours(endHours, endMinutes, 0, 0);
  
  // If appointment is APPROVED and current time is past start time
  if (appointment.status === 'APPROVED' && now >= appointmentDate) {
    return {
      shouldTransition: true,
      newStatus: 'IN_PROGRESS',
      reason: 'Appointment start time reached'
    };
  }
  
  // If appointment is IN_PROGRESS and current time is past end time
  if (appointment.status === 'IN_PROGRESS' && now >= appointmentEndDate) {
    return {
      shouldTransition: true,
      newStatus: 'COMPLETED',
      reason: 'Appointment end time reached'
    };
  }
  
  return {
    shouldTransition: false
  };
};

/**
 * Validate cancellation policy (example: can't cancel within 24 hours)
 */
const canCancelAppointment = (appointment, cancellationHours = 24) => {
  const now = new Date();
  const appointmentDate = new Date(appointment.date);
  const [hours, minutes] = appointment.startTime.split(':').map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);
  
  const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
  
  if (hoursUntilAppointment < cancellationHours) {
    return {
      canCancel: false,
      reason: `Cannot cancel within ${cancellationHours} hours of appointment`
    };
  }
  
  return {
    canCancel: true,
    reason: 'Cancellation allowed'
  };
};

module.exports = {
  isValidTransition,
  canUserTransition,
  canProviderTransition,
  canAdminTransition,
  validateTransition,
  getAllowedTransitions,
  isTerminalStatus,
  getAutoTransitionStatus,
  canCancelAppointment,
  VALID_TRANSITIONS,
  USER_ALLOWED_TRANSITIONS,
  PROVIDER_ALLOWED_TRANSITIONS,
  ADMIN_ALLOWED_TRANSITIONS
};
