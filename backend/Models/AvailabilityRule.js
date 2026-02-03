const mongoose = require('mongoose');

const availabilityRuleSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider is required']
  },
  dayOfWeek: {
    type: String,
    required: [true, 'Day of week is required'],
    enum: {
      values: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      message: '{VALUE} is not a valid day'
    }
  },
  timeSlots: [{
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  exceptionDates: [{
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    type: {
      type: String,
      enum: ['HOLIDAY', 'PERSONAL', 'BLOCKED', 'OTHER'],
      default: 'BLOCKED'
    }
  }],
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  }
}, {
  timestamps: true
});

// Compound index to ensure one rule per provider per day
availabilityRuleSchema.index({ providerId: 1, dayOfWeek: 1 }, { unique: true });
availabilityRuleSchema.index({ providerId: 1, isActive: 1 });

// Validate time slots don't overlap
availabilityRuleSchema.pre('save', function(next) {
  const slots = this.timeSlots;
  
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slot1 = slots[i];
      const slot2 = slots[j];
      
      // Check if slots overlap
      if (slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime) {
        return next(new Error('Time slots cannot overlap within the same day'));
      }
    }
  }
  
  next();
});

// Static method to check if a date is an exception
availabilityRuleSchema.statics.isExceptionDate = async function(providerId, date) {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const rule = await this.findOne({
    providerId: providerId,
    'exceptionDates.date': dateOnly
  });
  
  return rule !== null;
};

// Get all exception dates for a provider
availabilityRuleSchema.statics.getExceptionDates = async function(providerId, startDate, endDate) {
  const rules = await this.find({
    providerId: providerId,
    'exceptionDates.date': {
      $gte: startDate,
      $lte: endDate
    }
  });
  
  const exceptions = [];
  rules.forEach(rule => {
    rule.exceptionDates.forEach(exc => {
      if (exc.date >= startDate && exc.date <= endDate) {
        exceptions.push({
          date: exc.date,
          reason: exc.reason,
          type: exc.type
        });
      }
    });
  });
  
  return exceptions;
};

const AvailabilityRule = mongoose.model('AvailabilityRule', availabilityRuleSchema);

module.exports = AvailabilityRule;
