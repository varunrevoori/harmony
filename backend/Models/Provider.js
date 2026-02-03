const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: {
      values: ['HEALTHCARE', 'CONSULTING', 'BEAUTY', 'FITNESS', 'EDUCATION', 'LEGAL', 'OTHER'],
      message: '{VALUE} is not a valid service type'
    }
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  specializations: [{
    type: String,
    trim: true
  }],
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR']
    },
    pricingModel: {
      type: String,
      enum: ['PER_HOUR', 'PER_SESSION', 'FLAT_RATE'],
      default: 'PER_SESSION'
    }
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  slotDuration: {
    type: Number,
    required: [true, 'Slot duration is required'],
    min: [15, 'Slot duration must be at least 15 minutes'],
    max: [480, 'Slot duration cannot exceed 8 hours'],
    default: 60 // minutes
  },
  maxAppointmentsPerDay: {
    type: Number,
    default: 10,
    min: [1, 'Must allow at least 1 appointment per day'],
    max: [50, 'Cannot exceed 50 appointments per day']
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalAppointments: {
    type: Number,
    default: 0
  },
  completedAppointments: {
    type: Number,
    default: 0
  },
  cancelledAppointments: {
    type: Number,
    default: 0
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  workingHours: {
    monday: { isAvailable: { type: Boolean, default: false } },
    tuesday: { isAvailable: { type: Boolean, default: false } },
    wednesday: { isAvailable: { type: Boolean, default: false } },
    thursday: { isAvailable: { type: Boolean, default: false } },
    friday: { isAvailable: { type: Boolean, default: false } },
    saturday: { isAvailable: { type: Boolean, default: false } },
    sunday: { isAvailable: { type: Boolean, default: false } }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
providerSchema.index({ userId: 1 });
providerSchema.index({ serviceType: 1, 'rating.average': -1 });
providerSchema.index({ 'location.city': 1, serviceType: 1 });

// Calculate utilization percentage
providerSchema.virtual('utilizationRate').get(function() {
  if (this.totalAppointments === 0) return 0;
  return ((this.completedAppointments / this.totalAppointments) * 100).toFixed(2);
});

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;
