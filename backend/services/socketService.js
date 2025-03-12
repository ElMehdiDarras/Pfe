// src/services/socketService.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Notification = require('../models/notifications');
const { createNotificationFromAlarm } = require('../utils/notificationUtils');

// Store connected clients with userId as key and socket as value
const connectedClients = new Map();

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const initSocketServer = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Store connection in map
    connectedClients.set(socket.user._id.toString(), socket);
    
    // Join rooms based on user role and sites
    joinUserRooms(socket);
    
    // Send initial unread count
    sendUnreadCount(socket);
    
    // Listen for client events
    setupSocketListeners(socket);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      connectedClients.delete(socket.user._id.toString());
    });
  });

  return io;
};

/**
 * Set up event listeners for a socket
 * @param {Object} socket - Socket.IO socket
 */
const setupSocketListeners = (socket) => {
  // Client acknowledges notification
  socket.on('notification:acknowledge', async (data) => {
    try {
      const { notificationId } = data;
      if (notificationId) {
        await Notification.findOneAndUpdate(
          { _id: notificationId, userId: socket.user._id },
          { read: true, readAt: new Date() }
        );
        
        // Send updated unread count
        sendUnreadCount(socket);
      }
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  });
  
  // Client requests notification refresh
  socket.on('notification:refresh', () => {
    sendUnreadCount(socket);
  });
  
  // Client subscribes to a specific site
  socket.on('site:subscribe', (siteId) => {
    if (siteId && typeof siteId === 'string') {
      socket.join(`site:${siteId}`);
    }
  });
  
  // Client unsubscribes from a specific site
  socket.on('site:unsubscribe', (siteId) => {
    if (siteId && typeof siteId === 'string') {
      socket.leave(`site:${siteId}`);
    }
  });
};

/**
 * Join user to appropriate rooms
 * @param {Object} socket - Socket.IO socket
 */
const joinUserRooms = (socket) => {
  const { user } = socket;
  
  // Join user-specific room
  socket.join(`user:${user._id}`);
  
  // Join room based on role
  socket.join(`role:${user.role}`);
  
  // For agents, join site-specific rooms
  if (user.role === 'agent' && user.sites && user.sites.length > 0) {
    user.sites.forEach(site => {
      if (site && typeof site === 'string') {
        socket.join(`site:${site}`);
      }
    });
  } else if (user.role === 'supervisor' || user.role === 'administrator') {
    // Supervisors and admins see all sites
    socket.join('allSites');
  }
};

/**
 * Send unread notification count to user
 * @param {Object} socket - Socket.IO socket
 */
const sendUnreadCount = async (socket) => {
  try {
    const count = await Notification.countDocuments({
      userId: socket.user._id,
      read: false
    });
    
    socket.emit('notification:count', { count });
  } catch (error) {
    console.error('Error sending unread count:', error);
  }
};

/**
 * Send notification to specific user
 * @param {String} userId - User ID
 * @param {String} message - Notification message
 * @param {String} status - Notification status (INFO, WARNING, etc.)
 * @param {Object} io - Socket.IO server instance
 */
const sendNotificationToUser = async (userId, message, status = 'INFO', io) => {
  try {
    // Create notification
    const notification = new Notification({
      userId,
      message,
      type: 'SYSTEM',
      status,
      read: false
    });
    
    // Save to database
    await notification.save();
    
    // Send to user if connected
    const userSocket = connectedClients.get(userId.toString());
    if (userSocket) {
      userSocket.emit('notification', {
        type: 'notification',
        data: notification.toObject()
      });
      
      // Update unread count
      sendUnreadCount(userSocket);
    }
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
};

/**
 * Process alarm and send notifications
 * @param {Object} alarm - Alarm object
 * @param {Object} io - Socket.IO server instance
 */
const processAlarmNotification = async (alarm, io) => {
  try {
    // Create notifications in database based on user roles and access
    const users = await User.find().select('_id username role sites');
    
    // Use transaction to ensure atomic operations
    const session = await Notification.startSession();
    session.startTransaction();
    
    try {
      // Create and insert notifications
      const notificationsToCreate = [];
      
      for (const user of users) {
        // Skip users who don't have access to this site (for agent users)
        if (user.role === 'agent' && 
            user.sites && 
            Array.isArray(user.sites) && 
            !user.sites.includes(alarm.siteId)) {
          continue;
        }
        
        // Create notification object
        const notification = createNotificationFromAlarm(alarm, user);
        notificationsToCreate.push(notification);
      }
      
      // Insert all notifications
      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate, { session });
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Emit events to connected clients
      broadcastNotifications(io, notificationsToCreate, alarm);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error processing alarm notification:', error);
  }
};

/**
 * Broadcast notifications to appropriate users
 * @param {Object} io - Socket.IO server instance
 * @param {Array} notifications - Array of notification objects
 * @param {Object} alarm - Original alarm object
 */
const broadcastNotifications = (io, notifications, alarm) => {
  try {
    // Broadcast to appropriate rooms based on notification type and site
    if (alarm && alarm.siteId) {
      // Broadcast site-specific notification
      io.to(`site:${alarm.siteId}`).to('allSites').emit('notification', {
        type: 'notification',
        data: {
          message: alarm.description || 'Alarm triggered',
          status: alarm.status,
          siteId: alarm.siteId,
          equipment: alarm.equipment,
          timestamp: new Date().toISOString()
        }
      });
      
      // Also emit alarm status change event
      io.to(`site:${alarm.siteId}`).to('allSites').emit('alarm-status-change', {
        type: 'alarm-status-change',
        data: {
          alarmId: alarm._id,
          siteId: alarm.siteId,
          equipment: alarm.equipment,
          status: alarm.status,
          previousStatus: alarm.previousStatus,
          description: alarm.description,
          timestamp: alarm.timestamp || new Date().toISOString()
        }
      });
    }
    
    // Send personal notifications to each user
    notifications.forEach(notification => {
      if (notification.userId) {
        const userSocket = connectedClients.get(notification.userId.toString());
        
        if (userSocket) {
          userSocket.emit('notification', {
            type: 'notification',
            data: notification
          });
          
          // Also update their unread count
          sendUnreadCount(userSocket);
        }
      }
    });
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
  }
};

/**
 * Broadcast a system-wide notification to all connected users
 * @param {String} message - Notification message
 * @param {String} status - Notification status
 * @param {Object} io - Socket.IO server instance
 */
const broadcastSystemNotification = async (message, status = 'INFO', io) => {
  try {
    // Get all users
    const users = await User.find().select('_id');
    
    // Create notifications for all users
    const notifications = users.map(user => ({
      userId: user._id,
      message,
      type: 'SYSTEM',
      status,
      read: false
    }));
    
    // Save notifications to database
    await Notification.insertMany(notifications);
    
    // Broadcast to all connected clients
    io.emit('notification', {
      type: 'system',
      data: {
        message,
        status,
        timestamp: new Date().toISOString()
      }
    });
    
    // Update unread counts for all connected users
    for (const [userId, socket] of connectedClients.entries()) {
      sendUnreadCount(socket);
    }
  } catch (error) {
    console.error('Error broadcasting system notification:', error);
  }
};

/**
 * Get statistics about connected users
 * @returns {Object} Connection statistics
 */
const getConnectionStats = () => {
  const stats = {
    totalConnected: connectedClients.size,
    usersByRole: {
      administrator: 0,
      supervisor: 0,
      agent: 0
    }
  };
  
  // Count users by role
  for (const [userId, socket] of connectedClients.entries()) {
    if (socket.user && socket.user.role) {
      stats.usersByRole[socket.user.role] = (stats.usersByRole[socket.user.role] || 0) + 1;
    }
  }
  
  return stats;
};

// Export functions for use in other parts of the application
module.exports = {
  initSocketServer,
  processAlarmNotification,
  sendNotificationToUser,
  broadcastNotifications,
  broadcastSystemNotification,
  getConnectionStats,
  connectedClients
};