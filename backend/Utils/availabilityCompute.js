const { 
  addMinutes, 
  format, 
  parse, 
  isWithinInterval, 
  startOfDay, 
  endOfDay 
} = require('date-fns');
const AvailabilityRule = require('../Models/AvailabilityRule');
const Appointment = require('../Models/Appointment');

/**
 * Compute available time slots for a provider on a specific date
 * @param {ObjectId} providerId - Provider ID
 * @param {Date} date - Target date
 * @param {Number} slotDuration - Slot duration in minutes
 * @returns {Array} Array of available time slots
 */
const computeAvailableSlots = async (providerId, date, slotDuration = 60) => {
  try {
    const targetDate = new Date(date);
    const dayOfWeek = getDayOfWeek(targetDate);
    
    console.log('=== Computing Available Slots ===');
    console.log('Provider ID:', providerId);
    console.log('Target Date:', targetDate);
    console.log('Day of Week:', dayOfWeek);
    console.log('Slot Duration:', slotDuration);
    
    // Step 1: Check if date is an exception (blocked/holiday)
    const isException = await AvailabilityRule.isExceptionDate(providerId, targetDate);
    console.log('Is Exception Date:', isException);
    
    if (isException) {
      return {
        date: targetDate,
        dayOfWeek: dayOfWeek,
        availableSlots: [],
        message: 'This date is blocked (holiday or exception)'
      };
    }
    
    // Step 2: Get availability rules for this day
    const availabilityRule = await AvailabilityRule.findOne({
      providerId: providerId,
      dayOfWeek: dayOfWeek,
      isActive: true
    });
    
    console.log('Availability Rule Found:', !!availabilityRule);
    if (availabilityRule) {
      console.log('Time Slots:', JSON.stringify(availabilityRule.timeSlots));
      console.log('Is Active:', availabilityRule.isActive);
    } else {
      console.log('No availability rule found for provider:', providerId, 'on day:', dayOfWeek);
    }
    
    if (!availabilityRule || availabilityRule.timeSlots.length === 0) {
      return {
        date: targetDate,
        dayOfWeek: dayOfWeek,
        availableSlots: [],
        message: 'Provider is not available on this day'
      };
    }
    
    // Step 3: Get existing appointments for this date
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);
    
    const existingAppointments = await Appointment.find({
      providerId: providerId,
      date: { $gte: startOfTargetDay, $lte: endOfTargetDay },
      status: { $in: ['REQUESTED', 'APPROVED', 'IN_PROGRESS'] }
    }).select('startTime endTime');
    
    // Step 4: Generate all possible slots from time windows
    const allPossibleSlots = [];
    
    for (const timeSlot of availabilityRule.timeSlots) {
      const slots = generateSlotsForWindow(
        targetDate,
        timeSlot.startTime,
        timeSlot.endTime,
        slotDuration
      );
      allPossibleSlots.push(...slots);
    }
    
    // Step 5: Filter out booked slots
    const availableSlots = allPossibleSlots.filter(slot => {
      return !isSlotBooked(slot, existingAppointments);
    });
    
    console.log('Total Possible Slots:', allPossibleSlots.length);
    console.log('Available Slots:', availableSlots.length);
    console.log('Booked Slots:', allPossibleSlots.length - availableSlots.length);
    console.log('=================================');
    
    return {
      date: targetDate,
      dayOfWeek: dayOfWeek,
      totalSlots: allPossibleSlots.length,
      bookedSlots: allPossibleSlots.length - availableSlots.length,
      availableSlots: availableSlots,
      message: availableSlots.length > 0 ? 'Slots available' : 'All slots are booked'
    };
    
  } catch (error) {
    console.error('Error computing available slots:', error);
    throw error;
  }
};

/**
 * Generate time slots for a specific time window
 */
function generateSlotsForWindow(date, startTime, endTime, slotDuration) {
  const slots = [];
  const dateStr = format(date, 'yyyy-MM-dd');
  
  console.log('Generating slots for window:', {
    date: dateStr,
    startTime,
    endTime,
    slotDuration
  });
  
  // Parse start and end times
  let currentTime = parse(`${dateStr} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  const windowEnd = parse(`${dateStr} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());
  
  console.log('Parsed times:', {
    currentTime: currentTime.toString(),
    windowEnd: windowEnd.toString(),
    isValid: !isNaN(currentTime.getTime()) && !isNaN(windowEnd.getTime())
  });
  
  // Generate slots
  while (currentTime < windowEnd) {
    const slotEnd = addMinutes(currentTime, slotDuration);
    
    // Only add slot if it fits completely within the window
    if (slotEnd <= windowEnd) {
      slots.push({
        startTime: format(currentTime, 'HH:mm'),
        endTime: format(slotEnd, 'HH:mm'),
        duration: slotDuration
      });
    }
    
    currentTime = slotEnd;
  }
  
  return slots;
}

/**
 * Check if a slot is already booked
 */
function isSlotBooked(slot, existingAppointments) {
  for (const appointment of existingAppointments) {
    // Check if there's any overlap
    if (timesOverlap(slot.startTime, slot.endTime, appointment.startTime, appointment.endTime)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if two time ranges overlap
 */
function timesOverlap(start1, end1, start2, end2) {
  // Convert to comparable format
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  // Check overlap: start1 < end2 && end1 > start2
  return s1 < e2 && e1 > s2;
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get day of week in required format
 */
function getDayOfWeek(date) {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
}

/**
 * Compute availability for a date range
 */
const computeAvailabilityRange = async (providerId, startDate, endDate, slotDuration = 60) => {
  try {
    const results = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      const dayAvailability = await computeAvailableSlots(
        providerId,
        new Date(currentDate),
        slotDuration
      );
      results.push(dayAvailability);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return results;
  } catch (error) {
    console.error('Error computing availability range:', error);
    throw error;
  }
};

/**
 * Validate if a specific time slot is available
 */
const validateSlotAvailability = async (providerId, date, startTime, endTime) => {
  try {
    const targetDate = new Date(date);
    const dayOfWeek = getDayOfWeek(targetDate);
    
    // Check exception dates
    const isException = await AvailabilityRule.isExceptionDate(providerId, targetDate);
    if (isException) {
      return { available: false, reason: 'Date is blocked' };
    }
    
    // Check availability rule
    const rule = await AvailabilityRule.findOne({
      providerId: providerId,
      dayOfWeek: dayOfWeek,
      isActive: true
    });
    
    if (!rule) {
      return { available: false, reason: 'Provider not available on this day' };
    }
    
    // Check if requested time falls within any time slot
    let withinTimeWindow = false;
    for (const slot of rule.timeSlots) {
      if (isTimeWithinWindow(startTime, endTime, slot.startTime, slot.endTime)) {
        withinTimeWindow = true;
        break;
      }
    }
    
    if (!withinTimeWindow) {
      return { available: false, reason: 'Time not within provider availability window' };
    }
    
    // Check for overlapping appointments
    const hasOverlap = await Appointment.checkOverlap(
      providerId,
      null, // userId not needed for provider overlap check
      targetDate,
      startTime,
      endTime
    );
    
    if (hasOverlap) {
      return { available: false, reason: 'Time slot already booked' };
    }
    
    return { available: true, reason: 'Slot is available' };
    
  } catch (error) {
    console.error('Error validating slot:', error);
    throw error;
  }
};

/**
 * Check if time is within window
 */
function isTimeWithinWindow(startTime, endTime, windowStart, windowEnd) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const wStart = timeToMinutes(windowStart);
  const wEnd = timeToMinutes(windowEnd);
  
  return start >= wStart && end <= wEnd;
}

module.exports = {
  computeAvailableSlots,
  computeAvailabilityRange,
  validateSlotAvailability,
  getDayOfWeek
};
