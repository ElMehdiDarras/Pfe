// src/api/services/authService.js
import api from '../axios';

// Authentication-related API calls
const authService = {
  // Login user
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Make sure to capture the user's site access information
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Ensure the user object includes the sites field for agents
        const user = response.data.user;
        if (user.role === 'agent' && !user.sites) {
          user.sites = [];
        }
        
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      // Remove token from API headers
      delete api.defaults.headers.common['Authorization'];
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      
      // Update stored user data
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
  
  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', { 
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  },
  
  // Get stored user
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Check if user has access to a specific site
  hasAccessToSite: (user, siteName) => {
    if (!user) return false;
    
    // Admins and supervisors have access to all sites
    if (user.role === 'administrator' || user.role === 'supervisor') {
      return true;
    }
    
    // Agents can only access their assigned sites
    return user.sites && user.sites.includes(siteName);
  }
};

export default authService;