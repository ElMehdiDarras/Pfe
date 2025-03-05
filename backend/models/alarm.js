const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  siteId: {
    type: String,
    required: true,
    index: true
  },
  boxId: {
    type: String,
    required: true,
    index: true
  },
  pinId: {
    type: String,
    required: true
  },
  equipment: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OK', 'WARNING', 'MAJOR', 'CRITICAL', 'UNKNOWN'],
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  acknowledgedBy: {
    type: String,
    default: null
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  // For tracking alarm history
  statusHistory: [{
    status: {
      type: String,
      enum: ['OK', 'WARNING', 'MAJOR', 'CRITICAL', 'UNKNOWN']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Create a compound index for efficient queries
alarmSchema.index({ siteId: 1, boxId: 1, pinId: 1, timestamp: -1 });
alarmSchema.index({ status: 1, acknowledgedAt: 1 }); // For filtering active alarms
alarmSchema.index({ timestamp: -1 }); // For time-series queries

// Middleware to track status changes in history
alarmSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: this.timestamp || new Date()
    });
  }
  next();
});

// Static method to get active alarms
alarmSchema.statics.getActiveAlarms = function() {
  return this.find({
    status: { $ne: 'OK' },
    resolvedAt: null
  }).sort({ timestamp: -1 });
};

// Static method to get alarms by site
alarmSchema.statics.getAlarmsBySite = function(siteId) {
  return this.find({ siteId }).sort({ timestamp: -1 });
};

// Static method to get alarms with time range
alarmSchema.statics.getAlarmsInTimeRange = function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

// Method to acknowledge an alarm
alarmSchema.methods.acknowledge = function(userId) {
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Alarm', alarmSchema);