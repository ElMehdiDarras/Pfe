// src/api/services/alarmService.js
import api from '../axios';

// Alarm-related API calls
const alarmService = {
  // Get all alarms
  getAllAlarms: async () => {
    try {
      const response = await api.get('/alarms');
      return response.data;
    } catch (error) {
      console.error('Error fetching alarms:', error);
      throw error;
    }
  },
  
  // Get active alarms
  getActiveAlarms: async () => {
    try {
      const response = await api.get('/alarms/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active alarms:', error);
      throw error;
    }
  },
  
  // Get alarms by site
  getAlarmsBySite: async (siteId) => {
    try {
      const response = await api.get(`/alarms/site/${siteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching alarms for site ${siteId}:`, error);
      throw error;
    }
  },
  
  // Get alarm statistics with time range support
  getAlarmStatistics: async (timeRange = '24h') => {
    try {
      const response = await api.get('/alarms/statistics', { params: { timeRange } });
      return response.data;
    } catch (error) {
      console.error('Error fetching alarm statistics:', error);
      throw error;
    }
  },
  
  // Acknowledge an alarm
  acknowledgeAlarm: async (alarmId, userId) => {
    try {
      const response = await api.post(`/alarms/${alarmId}/acknowledge`, { userId });
      return response.data;
    } catch (error) {
      console.error(`Error acknowledging alarm ${alarmId}:`, error);
      throw error;
    }
  },
  
  // Get notifications
  getNotifications: async (limit = 10) => {
    try {
      const response = await api.get('/notifications', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  
  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },
  
  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  // Get notification count
  getNotificationCount: async () => {
    try {
      const response = await api.get('/notifications/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      throw error;
    }
  }
};

export default alarmService;