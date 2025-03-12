// src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', authenticateToken, notificationController.getNotifications);

/**
 * @route GET /api/notifications/count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/count', authenticateToken, notificationController.getNotificationCount);

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.patch('/:id/read', authenticateToken, notificationController.markAsRead);

/**
 * @route PATCH /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);

module.exports = router;

// src/controllers/notification.controller.js
const Notification = require('../models/notification.model');
const { handleServerError } = require('../utils/errorHandler');

/**
 * Get user notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get notifications for the current user
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.status(200).json(notifications);
  } catch (error) {
    handleServerError(res, error, 'Error fetching notifications');
  }
};

/**
 * Get unread notification count
 */
exports.getNotificationCount = async (req, res) => {
  try {
    // Count unread notifications for the current user
    const count = await Notification.countDocuments({ 
      userId: req.user.id,
      read: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    handleServerError(res, error, 'Error fetching notification count');
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    handleServerError(res, error, 'Error marking notification as read');
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    // Update all unread notifications for the current user
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    
    res.status(200).json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    handleServerError(res, error, 'Error marking all notifications as read');
  }
};

// src/models/notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['ALARM', 'SYSTEM', 'INFO'],
    default: 'ALARM'
  },
  status: {
    type: String,
    enum: ['CRITICAL', 'MAJOR', 'WARNING', 'INFO'],
    default: 'INFO'
  },
  siteId: {
    type: String
  },
  equipmentId: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;