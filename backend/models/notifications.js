// models/notifications.js
const mongoose = require('mongoose');

/**
 * Notification Schema
 * Stores user notifications for alarms and system events
 */
const notificationSchema = new mongoose.Schema({
  // User who should receive this notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification message
  message: {
    type: String,
    required: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: ['ALARM', 'SYSTEM', 'INFO'],
    default: 'ALARM'
  },
  
  // Notification status/severity
  status: {
    type: String,
    enum: ['CRITICAL', 'MAJOR', 'WARNING', 'INFO'],
    default: 'INFO'
  },
  
  // Associated site (if applicable)
  siteId: {
    type: String
  },
  
  // Associated equipment ID (if applicable)
  equipmentId: {
    type: String
  },
  
  // Has this notification been read?
  read: {
    type: Boolean,
    default: false
  },
  
  // Timestamp for notification
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // When was this notification read (if applicable)
  readAt: {
    type: Date
  }
});

// Create indexes for efficient querying
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, timestamp: -1 });
notificationSchema.index({ siteId: 1 });

// Define a TTL index to automatically delete old notifications (e.g., after 30 days)
notificationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Create the model
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;