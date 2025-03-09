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
  
  // Get alarm statistics
  getAlarmStatistics: async () => {
    try {
      const response = await api.get('/alarms/statistics');
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
  }
};

export default alarmService;