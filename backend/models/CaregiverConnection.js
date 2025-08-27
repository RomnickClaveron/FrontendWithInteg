const mongoose = require('mongoose');

const caregiverConnectionSchema = new mongoose.Schema({
  caregiverId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  elderId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  elderName: {
    type: String,
    required: true,
    trim: true
  },
  elderContactNumber: {
    type: String,
    required: true,
    trim: true
  },
  elderEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  elderAge: {
    type: Number,
    min: 0,
    max: 150
  },
  connectionStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure unique caregiver-elder pairs
caregiverConnectionSchema.index(
  { caregiverId: 1, elderId: 1 }, 
  { unique: true }
);

// Compound index for better query performance
caregiverConnectionSchema.index({ caregiverId: 1, connectionStatus: 1 });
caregiverConnectionSchema.index({ elderId: 1, connectionStatus: 1 });

// Virtual for connection duration
caregiverConnectionSchema.virtual('connectionDuration').get(function() {
  return Date.now() - this.connectedAt.getTime();
});

// Method to update last interaction
caregiverConnectionSchema.methods.updateInteraction = function() {
  this.lastInteraction = new Date();
  return this.save();
};

// Static method to get active connections for a caregiver
caregiverConnectionSchema.statics.getActiveConnections = function(caregiverId) {
  return this.find({ 
    caregiverId, 
    connectionStatus: 'active' 
  }).sort({ connectedAt: -1 });
};

// Static method to get all connections for an elder
caregiverConnectionSchema.statics.getElderConnections = function(elderId) {
  return this.find({ 
    elderId, 
    connectionStatus: 'active' 
  }).sort({ connectedAt: -1 });
};

module.exports = mongoose.model('CaregiverConnection', caregiverConnectionSchema);

