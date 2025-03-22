// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add auth token to requests - fixed implementation
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Log the token format (first few characters only for security)
    if (token) {
      console.log(`Token found (first 10 chars): ${token.substring(0, 10)}...`);
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log the complete header being set
      console.log(`Authorization header set: ${config.headers.Authorization.substring(0, 20)}...`);
    } else {
      console.warn(`Request to ${config.url} without auth token`);
    }
    
    // Log all headers for debugging
    console.log('All headers being sent:', JSON.stringify(config.headers));
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle auth errors - improved error logging
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response.data);
      // Don't automatically redirect or clear token
    }
    
    return Promise.reject(error);
  }
);

export default api;