// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/notifications');

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get notifications for the current user
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/notifications/count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/count', async (req, res) => {
  try {
    // Count unread notifications for the current user
    const count = await Notification.countDocuments({ 
      userId: req.user._id,
      read: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.patch('/read-all', async (req, res) => {
  try {
    // Update all unread notifications for the current user
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.status(200).json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;