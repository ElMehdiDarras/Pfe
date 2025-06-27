// models/alarm.js
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
  ignored: {
    type: Boolean,
    default: false
  },
  ignoredBy: {
    type: String,
    default: null
  },
  ignoredAt: {
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
alarmSchema.index({ status: 1, ignored: 1 }); // For filtering active alarms
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
    resolvedAt: null,
    ignoredBy: null  // Add this condition to exclude ignored alarms
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

// Method to ignore an alarm
alarmSchema.methods.ignore = function() {
  this.ignored = true;
  this.ignoredAt = new Date();
  return this.save();
};

// Method to unignore an alarm
alarmSchema.methods.unignore = function() {
  this.ignored = false;
  this.ignoredAt = null;
  return this.save();
};

module.exports = mongoose.model('Alarm', alarmSchema);