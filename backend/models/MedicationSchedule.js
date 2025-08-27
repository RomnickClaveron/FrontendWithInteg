const mongoose = require('mongoose');

const medicationScheduleSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  medicationName: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'twice_daily', 'thrice_daily', 'weekly', 'custom'],
    default: 'daily'
  },
  timeSlots: [{
    time: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  daysOfWeek: [{
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday, 1 = Monday, etc.
    default: [0, 1, 2, 3, 4, 5, 6] // All days by default
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null // null means ongoing
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: String,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
medicationScheduleSchema.index({ userId: 1, isActive: 1 });
medicationScheduleSchema.index({ createdBy: 1 });
medicationScheduleSchema.index({ startDate: 1, endDate: 1 });

// Virtual for schedule status
medicationScheduleSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.endDate && new Date() > this.endDate) return 'expired';
  return 'active';
});

// Method to check if schedule is currently active
medicationScheduleSchema.methods.isCurrentlyActive = function() {
  if (!this.isActive) return false;
  if (this.endDate && new Date() > this.endDate) return false;
  return true;
};

// Method to get next dose time
medicationScheduleSchema.methods.getNextDoseTime = function() {
  if (!this.isCurrentlyActive()) return null;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  
  for (const slot of this.timeSlots) {
    if (!slot.isActive) continue;
    
    const [hours, minutes] = slot.time.split(':').map(Number);
    const slotTime = hours * 60 + minutes;
    
    if (slotTime > currentTime) {
      return slot.time;
    }
  }
  
  // If no time today, return first time tomorrow
  return this.timeSlots[0]?.time || null;
};

// Static method to get active schedules for a user
medicationScheduleSchema.statics.getActiveSchedules = function(userId) {
  return this.find({ 
    userId, 
    isActive: true,
    $or: [
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ]
  }).sort({ startDate: -1 });
};

module.exports = mongoose.model('MedicationSchedule', medicationScheduleSchema);

