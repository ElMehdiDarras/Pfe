// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add auth token to requests with better logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log(`Adding auth token to request: ${config.url}`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log(`No auth token available for request: ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor for token expiration with better path checking
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('Session expired or unauthorized access');
      
      // Check if we're already on the login page
      if (window.location.pathname.includes('/login')) {
        console.log('Already on login page, not dispatching auth-error event');
        // Don't dispatch event if already on login page to prevent loops
      } else {
        console.log('Not on login page, clearing auth data and dispatching auth-error event');
        
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch a global auth event (to be caught by context)
        const authEvent = new CustomEvent('auth-error', { 
          detail: { type: 'session-expired' }
        });
        window.dispatchEvent(authEvent);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;