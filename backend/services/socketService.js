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
// Update the processAlarmNotification function to handle OK states better
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
      
      // Only create notifications for non-OK states or transitions to OK (resolutions)
      // This allows OK states to clear alarms without creating unnecessary notifications
      if (alarm.status !== 'OK' || alarm.previousStatus) {
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
          
          // For OK states (resolutions), mark existing notifications as read
          if (alarm.status === 'OK') {
            // Find and mark existing notifications for this alarm as read
            await Notification.updateMany(
              { 
                userId: user._id,
                siteId: alarm.siteId,
                equipmentId: alarm.equipment,
                read: false
              },
              { 
                $set: { 
                  read: true, 
                  readAt: new Date() 
                }
              },
              { session }
            );
            
            // Only add a resolution notification if we want to track resolutions
            // (you can comment this out if you don't want resolution notifications)
            notificationsToCreate.push(notification);
          } else {
            // For new alarms, always create notifications
            notificationsToCreate.push(notification);
          }
        }
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
 * Process pin state change from Modbus device
 * @param {String} siteId - Site ID or name
 * @param {String} boxId - Box ID or name
 * @param {Number} pinNumber - Pin number
 * @param {Number} newState - New pin state (0 or 1)
 * @param {Object} io - Socket.IO server instance
 */
const processPinStateChange = async (siteId, boxId, pinNumber, newState, io) => {
  try {
    // Find pin configuration
    const pinConfig = await require('../models/pinConfiguration').findOne({
      siteId,
      boxId,
      pinNumber
    });
    
    if (!pinConfig) {
      console.error(`No pin configuration found for ${siteId}, box: ${boxId}, pin: ${pinNumber}`);
      return;
    }
    
    // Get existing alarm for this pin
    const Alarm = require('../models/alarm');
    const existingAlarm = await Alarm.findOne({
      siteId,
      boxId,
      pinId: pinNumber.toString(),
      resolvedAt: null
    });
    
    // Determine if this is an alarm condition
    const isAlarmCondition = pinConfig.normallyOpen ? 
      (newState === 1) : (newState === 0);
    
    const status = isAlarmCondition ? 
      pinConfig.alarmSeverity || 'CRITICAL' : 'OK';
    
    if (isAlarmCondition) {
      // Create or update alarm
      if (existingAlarm) {
        // Only update if status changed
        if (existingAlarm.status !== status) {
          const previousStatus = existingAlarm.status;
          
          existingAlarm.status = status;
          existingAlarm.statusHistory.push({
            status,
            timestamp: new Date()
          });
          
          await existingAlarm.save();
          
          // Create notification with status change context
          const alarmWithContext = {
            ...existingAlarm.toObject(),
            previousStatus
          };
          
          await processAlarmNotification(alarmWithContext, io);
        }
      } else {
        // Create new alarm
        const newAlarm = new Alarm({
          siteId,
          boxId,
          pinId: pinNumber.toString(),
          equipment: pinConfig.equipmentName,
          description: pinConfig.description,
          status,
          timestamp: new Date(),
          statusHistory: [{
            status,
            timestamp: new Date()
          }]
        });
        
        await newAlarm.save();
        
        // Process notification for new alarm
        await processAlarmNotification(newAlarm, io);
      }
    } else if (existingAlarm) {
      // Resolve existing alarm
      const previousStatus = existingAlarm.status;
      
      existingAlarm.status = 'OK';
      existingAlarm.resolvedAt = new Date();
      existingAlarm.statusHistory.push({
        status: 'OK',
        timestamp: new Date()
      });
      
      await existingAlarm.save();
      
      // Create notification for resolved alarm with context
      const resolvedAlarm = {
        ...existingAlarm.toObject(),
        previousStatus
      };
      
      await processAlarmNotification(resolvedAlarm, io);
    }
    
    // Update site and equipment status
    await updateSiteAndEquipmentStatus(siteId, pinConfig.equipmentName, status);
    
  } catch (error) {
    console.error('Error processing pin state change:', error);
  }
};

/**
 * Update site and equipment status
 * @param {String} siteId - Site ID or name
 * @param {String} equipmentName - Equipment name
 * @param {String} status - New status
 */
const updateSiteAndEquipmentStatus = async (siteId, equipmentName, status) => {
  try {
    const Site = require('../models/sites');
    
    // Update equipment status
    if (equipmentName) {
      await Site.updateOne(
        { name: siteId, "equipment.name": equipmentName },
        { $set: { "equipment.$.status": status } }
      );
    }
    
    // Get all active alarms for this site to determine overall status
    const Alarm = require('../models/alarm');
    const activeAlarms = await Alarm.find({
      siteId,
      status: { $ne: 'OK' },
      resolvedAt: null
    });
    
    let worstStatus = 'OK';
    let activeCount = activeAlarms.length;
    
    for (const alarm of activeAlarms) {
      if (alarm.status === 'CRITICAL') {
        worstStatus = 'CRITICAL';
      } else if (alarm.status === 'MAJOR' && worstStatus !== 'CRITICAL') {
        worstStatus = 'MAJOR';
      } else if (alarm.status === 'WARNING' && worstStatus !== 'CRITICAL' && worstStatus !== 'MAJOR') {
        worstStatus = 'WARNING';
      }
    }
    
    // Update site status
    await Site.updateOne(
      { name: siteId },
      { 
        $set: { 
          status: worstStatus,
          activeAlarms: activeCount
        }
      }
    );
  } catch (error) {
    console.error(`Error updating site status for ${siteId}:`, error);
  }
};

/**
 * Clear notifications for resolved alarms
 * @param {String} siteId - Site ID
 * @param {String} equipmentName - Equipment name
 * @param {Object} io - Socket.IO instance
 */
const clearResolvedAlarmNotifications = async (siteId, equipmentName, io) => {
  try {
    // Mark all related notifications as read
    const result = await Notification.updateMany(
      { 
        siteId: siteId,
        equipmentId: equipmentName,
        read: false
      },
      { 
        $set: { 
          read: true, 
          readAt: new Date() 
        }
      }
    );
    
    console.log(`Marked ${result.modifiedCount} notifications as read for resolved alarm: ${siteId} - ${equipmentName}`);
    
    // Notify connected clients to refresh their notification count
    if (result.modifiedCount > 0) {
      // Get all users who might have these notifications
      const users = await User.find().select('_id role sites');
      
      for (const user of users) {
        // Skip users who don't have access to this site
        if (user.role === 'agent' && 
            user.sites && 
            Array.isArray(user.sites) && 
            !user.sites.includes(siteId)) {
          continue;
        }
        
        // Get this user's socket
        const userSocket = connectedClients.get(user._id.toString());
        if (userSocket) {
          // Send updated count
          sendUnreadCount(userSocket);
          
          // Emit a notification clear event
          userSocket.emit('notification:clear', {
            siteId,
            equipmentId: equipmentName
          });
        }
      }
      
      // Also broadcast to site and all-sites rooms
      io.to(`site:${siteId}`).to('allSites').emit('notification:clear', {
        siteId,
        equipmentId: equipmentName
      });
    }
  } catch (error) {
    console.error('Error clearing resolved alarm notifications:', error);
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
      // Define the alarm event data 
      const alarmEventData = {
        type: 'alarm-status-change',
        data: {
          alarmId: alarm._id,
          siteId: alarm.siteId,
          boxId: alarm.boxId,
          pinId: alarm.pinId,
          equipment: alarm.equipment,
          status: alarm.status,
          previousStatus: alarm.previousStatus,
          description: alarm.description,
          timestamp: alarm.timestamp || new Date().toISOString()
        }
      };
      
      // For newly resolved alarms (OK status)
      if (alarm.status === 'OK' && alarm.previousStatus) {
        alarmEventData.data.isResolved = true;
        alarmEventData.data.resolvedAt = alarm.resolvedAt || new Date().toISOString();
      }
      
      // Emit to site-specific rooms and global supervisors/admins
      io.to(`site:${alarm.siteId}`).to('allSites').emit('alarm-status-change', alarmEventData);
      
      // For status display in notification bell
      io.to(`site:${alarm.siteId}`).to('allSites').emit('notification', {
        type: 'notification',
        data: {
          message: alarm.status === 'OK' 
            ? `${alarm.siteId}: ${alarm.equipment} - RESOLVED` 
            : `${alarm.siteId}: ${alarm.equipment} - ${alarm.description}`,
          status: alarm.status,
          siteId: alarm.siteId,
          equipment: alarm.equipment,
          timestamp: new Date().toISOString(),
          isResolved: alarm.status === 'OK'
        }
      });
    }
    
    // Send personal notifications to each user (existing code)
    // ...
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
  clearResolvedAlarmNotifications,
  processPinStateChange,
  broadcastNotifications,
  broadcastSystemNotification,
  getConnectionStats,
  connectedClients
};