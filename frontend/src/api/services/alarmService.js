// src/api/services/alarmService.js
import api from '../axios';

const alarmService = {
  // Get all alarms
  // In alarmService.js
getAllAlarms: async (params = {}) => {
  try {
    const { 
      limit = 100, 
      skip = 0, 
      sortBy = 'timestamp', 
      sortOrder = -1,
      includeResolved = true // Include resolved alarms by default
    } = params;
    
    // Build query
    const query = {};
    
    // Only include active alarms if specified
    if (!includeResolved) {
      query.resolvedAt = null;
    }
    
    const response = await api.get('/alarms', { 
      params: { 
        limit, 
        skip, 
        sortBy, 
        sortOrder,
        includeResolved
      } 
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching alarms:', error);
    throw error;
  }
},
  
  // Get active alarms
  getActiveAlarms: async () => {
    try {
      const response = await api.get('/alarms/active'); // No /api prefix
      return response.data;
    } catch (error) {
      console.error('Error fetching active alarms:', error);
      throw error;
    }
  },
  
  // Get alarms by site
  getAlarmsBySite: async (siteId) => {
    try {
      const response = await api.get(`/alarms/site/${siteId}`); // No /api prefix
      return response.data;
    } catch (error) {
      console.error(`Error fetching alarms for site ${siteId}:`, error);
      throw error;
    }
  },
  
  // Update the getAlarmStatistics method in alarmService.js to transform the data:
getAlarmStatistics: async (timeRange = '24h') => {
  try {
    console.log(`Fetching statistics for timeRange: ${timeRange}`); // Debugging
    const response = await api.get('/alarms/statistics', {
      params: { timeRange }
    });
    
    const data = response.data;
    console.log('Raw statistics response:', data); // Debugging
    
    // Check if we have the timeSeriesData from your backend
    if (data && data.timeSeriesData) {
      // Transform the data for chart display - format depends on requested timeRange
      let transformedData;
      
      if (timeRange === 'live' && data.timeSeriesData.recent) {
        // Format the recent data for live view
        transformedData = data.timeSeriesData.recent.map(item => ({
          hour: item.label,
          critical: item.critical || 0,
          major: item.major || 0,
          warning: item.warning || 0
        }));
      } else if (data.timeSeriesData.hourly) {
        // Format the hourly data for 24h view
        transformedData = data.timeSeriesData.hourly.map(item => ({
          hour: item.label,
          critical: item.critical || 0,
          major: item.major || 0,
          warning: item.warning || 0
        }));
      }
      
      // Add the transformed data to the response
      const transformedResponse = {
        ...data,
        last24Hours: transformedData
      };
      
      console.log('Transformed statistics data:', transformedResponse); // Debugging
      return transformedResponse;
    }
    
    // If data doesn't have the expected structure, return as is
    return data;
  } catch (error) {
    console.error('Error fetching alarm statistics:', error);
    throw error;
  }
},
getNotificationCount: async () => {
  try {
    const response = await api.get('/notifications/count');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification count:', error);
    throw error;
  }
},
// In src/api/services/alarmService.js
// Add this function if it's missing

// Get notifications
getNotifications: async (limit = 10) => {
  try {
    const response = await api.get('/notifications', { 
      params: { limit } 
    });
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
  
  // Acknowledge an alarm
  acknowledgeAlarm: async (alarmId) => {
    try {
      console.log('Acknowledging alarm:',alarmId);
      const response = await api.post(`/alarms/${alarmId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error(`Error acknowledging alarm ${alarmId}:`, error);
      throw error;
    }
  },
  
  // Acknowledge all alarms
  acknowledgeAllAlarms: async () => {
    try {
      const response = await api.post('/alarms/acknowledge-all');
      return response.data;
    } catch (error) {
      console.error('Error acknowledging all alarms:', error);
      throw error;
    }
  },

  getCurrentStates: async () => {
    try {
      const response = await api.get('/alarms/current-states');
      return response.data;
    } catch (error) {
      console.error('Error fetching current states:', error);
      throw error;
    }
  },
  
  // Get current states by site
  getCurrentStatesBySite: async (siteId) => {
    try {
      const response = await api.get(`/alarms/current-states/${siteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching current states for site ${siteId}:`, error);
      throw error;
    }
  },


};


export default alarmService;