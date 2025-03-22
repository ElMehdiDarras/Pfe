// src/api/services/authService.js with debugging
import api from '../axios';

// Add this console function to log when token methods are called
const logTokenOperation = (operation, token) => {
  console.log(`[AuthService] ${operation}: Token ${token ? 'exists' : 'missing'}`);
};

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const authService = {
  // Login
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.token) {
        // Store token and user
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        logTokenOperation('Login', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout
  logout: () => {
    logTokenOperation('Logout', localStorage.getItem(TOKEN_KEY));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  // Get stored token
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    logTokenOperation('getToken', token);
    return token;
  },
  
  // Get current user from storage
  getUser: () => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting user from storage:', error);
      return null;
    }
  },
  
  // Check if authenticated (token exists)
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    logTokenOperation('isAuthenticated', token);
    return !!token;
  },
  
  // Get current user from API
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      logTokenOperation('getCurrentUser', token);
      
      if (!token) {
        console.log('No token available, cannot get current user');
        return null;
      }
      
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      // If 401, clear token
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      return null;
    }
  },
  
  // Check if user has access to site
  hasAccessToSite: (user, siteName) => {
    if (!user) return false;
    
    // Admin and supervisors have access to all sites
    if (user.role === 'administrator' || user.role === 'supervisor') {
      return true;
    }
    
    // For agents, check site access
    if (user.role === 'agent' && user.sites && Array.isArray(user.sites)) {
      // Normalize site names for comparison
      const normalizedSiteName = siteName.replace(/[\s-]/g, '').toLowerCase();
      const hasAccess = user.sites.some(userSite => {
        const normalizedUserSite = userSite.replace(/[\s-]/g, '').toLowerCase();
        return normalizedSiteName === normalizedUserSite;
      });
      
      return hasAccess;
    }
    
    return false;
  }
};

export default authService;