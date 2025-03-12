// src/utils/notificationUtils.js

/**
 * Creates a notification object from an alarm event
 * @param {Object} alarm - The alarm object
 * @param {Object} user - The user object (optional, for user-specific notifications)
 * @returns {Object} Notification object
 */
exports.createNotificationFromAlarm = (alarm, user = null) => {
    // Determine severity based on alarm status
    let status = 'INFO';
    if (alarm.status === 'CRITICAL') status = 'CRITICAL';
    else if (alarm.status === 'MAJOR') status = 'MAJOR';
    else if (alarm.status === 'WARNING') status = 'WARNING';
    
    // Create message based on alarm properties
    const siteName = alarm.siteId || 'Unknown Site';
    const equipmentName = alarm.equipment || 'Unknown Equipment';
    const description = alarm.description || 'No description';
    
    let message = `${siteName}: ${equipmentName} - ${description}`;
    
    // For status changes, include the transition
    if (alarm.previousStatus) {
      message = `${siteName}: ${equipmentName} - Changed from ${alarm.previousStatus} to ${alarm.status}`;
    }
    
    return {
      userId: user ? user._id : null, // If specified, make it user-specific
      message,
      type: 'ALARM',
      status,
      siteId: siteName,
      equipmentId: alarm.equipmentId || null,
      read: false,
      createdAt: new Date()
    };
  };
  
  /**
   * Creates a system notification
   * @param {string} message - The notification message
   * @param {string} status - The notification status (INFO, WARNING, etc.)
   * @param {Object} user - The user object (optional, for user-specific notifications)
   * @returns {Object} Notification object
   */
  exports.createSystemNotification = (message, status = 'INFO', user = null) => {
    return {
      userId: user ? user._id : null,
      message,
      type: 'SYSTEM',
      status,
      read: false,
      createdAt: new Date()
    };
  };
  
  /**
   * Formats a notification message for display
   * @param {Object} notification - The notification object
   * @returns {string} Formatted message
   */
  exports.formatNotificationMessage = (notification) => {
    if (!notification) return '';
    
    switch (notification.type) {
      case 'ALARM':
        return notification.message;
      
      case 'SYSTEM':
        return `System: ${notification.message}`;
      
      case 'INFO':
        return `Info: ${notification.message}`;
      
      default:
        return notification.message;
    }
  };
  
  /**
   * Determines the notification color based on status
   * @param {string} status - The notification status
   * @returns {string} Color code
   */
  exports.getNotificationColor = (status) => {
    switch (status) {
      case 'CRITICAL':
        return '#f44336'; // Red
      case 'MAJOR':
        return '#ff9800'; // Orange
      case 'WARNING':
        return '#ffeb3b'; // Yellow
      case 'INFO':
      default:
        return '#2196f3'; // Blue
    }
  };
  
  /**
   * Creates notification objects from a batch of alarms
   * @param {Array} alarms - Array of alarm objects
   * @param {Array} users - Array of user objects (for broadcasting)
   * @returns {Array} Array of notification objects
   */
  exports.createNotificationsFromAlarms = (alarms, users = []) => {
    const notifications = [];
    
    alarms.forEach(alarm => {
      // For each alarm, either:
      // 1. Create a global notification (no userId)
      if (users.length === 0) {
        notifications.push(this.createNotificationFromAlarm(alarm));
      } 
      // 2. Create individual notifications for each user
      else {
        users.forEach(user => {
          // Skip users who don't have access to this site (for agent users)
          if (user.role === 'agent' && 
              user.sites && 
              !user.sites.includes(alarm.siteId)) {
            return;
          }
          
          notifications.push(this.createNotificationFromAlarm(alarm, user));
        });
      }
    });
    
    return notifications;
  };