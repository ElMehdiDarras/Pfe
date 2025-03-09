// src/api/services.js - Expanded with error handling and specific endpoints
import api from './axios';

// Site-related API calls
export const siteService = {
  getAllSites: async () => {
    try {
      const response = await api.get('/sites');
      return response.data;
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw error;
    }
  },
  
  getSiteById: async (id) => {
    try {
      const response = await api.get(`/sites/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching site ${id}:`, error);
      throw error;
    }
  },
  
  getSiteSummary: async () => {
    try {
      const response = await api.get('/sites/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching site summary:', error);
      throw error;
    }
  },
  
  createSite: async (siteData) => {
    try {
      const response = await api.post('/sites', siteData);
      return response.data;
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    }
  },
  
  updateSite: async (id, siteData) => {
    try {
      const response = await api.put(`/sites/${id}`, siteData);
      return response.data;
    } catch (error) {
      console.error(`Error updating site ${id}:`, error);
      throw error;
    }
  },
  
  deleteSite: async (id) => {
    try {
      const response = await api.delete(`/sites/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting site ${id}:`, error);
      throw error;
    }
  },
  
  // Box management
  addBox: async (siteId, boxData) => {
    try {
      const response = await api.post(`/sites/${siteId}/boxes`, boxData);
      return response.data;
    } catch (error) {
      console.error(`Error adding box to site ${siteId}:`, error);
      throw error;
    }
  },
  
  updateBox: async (siteId, boxIndex, boxData) => {
    try {
      const response = await api.put(`/sites/${siteId}/boxes/${boxIndex}`, boxData);
      return response.data;
    } catch (error) {
      console.error(`Error updating box ${boxIndex} for site ${siteId}:`, error);
      throw error;
    }
  },
  
  deleteBox: async (siteId, boxIndex) => {
    try {
      const response = await api.delete(`/sites/${siteId}/boxes/${boxIndex}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting box ${boxIndex} from site ${siteId}:`, error);
      throw error;
    }
  },
  
  // Equipment management
  addEquipment: async (siteId, equipmentData) => {
    try {
      const response = await api.post(`/sites/${siteId}/equipment`, equipmentData);
      return response.data;
    } catch (error) {
      console.error(`Error adding equipment to site ${siteId}:`, error);
      throw error;
    }
  },
  
  updateEquipment: async (siteId, equipIndex, equipmentData) => {
    try {
      const response = await api.put(`/sites/${siteId}/equipment/${equipIndex}`, equipmentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating equipment ${equipIndex} for site ${siteId}:`, error);
      throw error;
    }
  },
  
  deleteEquipment: async (siteId, equipIndex) => {
    try {
      const response = await api.delete(`/sites/${siteId}/equipment/${equipIndex}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting equipment ${equipIndex} from site ${siteId}:`, error);
      throw error;
    }
  }
};

// Alarm-related API calls
export const alarmService = {
  getAllAlarms: async (params = {}) => {
    try {
      const response = await api.get('/alarms', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alarms:', error);
      throw error;
    }
  },
  
  getActiveAlarms: async () => {
    try {
      const response = await api.get('/alarms/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active alarms:', error);
      throw error;
    }
  },
  
  getAlarmsBySite: async (siteId) => {
    try {
      const response = await api.get(`/alarms/site/${siteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching alarms for site ${siteId}:`, error);
      throw error;
    }
  },
  
  getFilteredAlarms: async (filters) => {
    try {
      const response = await api.get('/alarms/filter', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error filtering alarms:', error);
      throw error;
    }
  },
  
  getAlarmStatistics: async () => {
    try {
      const response = await api.get('/alarms/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching alarm statistics:', error);
      throw error;
    }
  },
  
  getAlarmHistory: async (siteId, startDate, endDate) => {
    try {
      const response = await api.get(`/alarms/history/${siteId}`, { 
        params: { startDate, endDate } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching alarm history for site ${siteId}:`, error);
      throw error;
    }
  },
  
  acknowledgeAlarm: async (alarmId) => {
    try {
      const response = await api.post(`/alarms/${alarmId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error(`Error acknowledging alarm ${alarmId}:`, error);
      throw error;
    }
  },
  
  generateReport: async (filters) => {
    try {
      const response = await api.get('/alarms/report/generate', { params: filters, responseType: 'blob' });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
};

// Authentication-related API calls
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Store token in localStorage for later use
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
      
      // Clear stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
  
  changePassword: async (passwords) => {
    try {
      const response = await api.post('/auth/change-password', passwords);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};

// User management API calls (admin only)
export const userService = {
  getAllUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  createUser: async (userData) => {
    try {
      const response = await api.post('/auth/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/auth/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },
  
  resetUserPassword: async (userId, newPassword) => {
    try {
      const response = await api.post(`/auth/users/${userId}/reset-password`, { newPassword });
      return response.data;
    } catch (error) {
      console.error(`Error resetting password for user ${userId}:`, error);
      throw error;
    }
  },
  
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }
};