// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect} from 'react';
import authService from '../api/services/authService';
// Remove the useNavigate import from here

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Remove useNavigate hook from here

  // Check token validity and expiration
  const checkTokenExpiration = () => {
    const token = localStorage.getItem('token');
    
    if (!token) return false;
    
    try {
      // Token validation logic
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const expiryTime = payload.exp * 1000;
      
      if (Date.now() >= expiryTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setError('Your session has expired. Please log in again.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error parsing token:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      return false;
    }
  };

  // Listen for auth errors from axios interceptor
  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail?.type === 'session-expired') {
        // Clear user state
        setUser(null);
        setError('Your session has expired. Please log in again.');
        
        // IMPORTANT FIX: Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    };
    
    window.addEventListener('auth-error', handleAuthError);
    
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If already on login page, just finish loading
        if (window.location.pathname.includes('/login')) {
          setLoading(false);
          return;
        }
        
        // First check token expiration
        if (!checkTokenExpiration()) {
          setLoading(false);
          return;
        }
        
        const storedUser = authService.getUser();
        if (storedUser && authService.isAuthenticated()) {
          // Set user from local storage
          setUser(storedUser);
          try {
            // Refresh user data from backend
            const freshUserData = await authService.getCurrentUser();
            if (freshUserData) {
              setUser(freshUserData);
            }
          } catch (err) {
            console.error('Error refreshing user data:', err);
            // If error getting fresh data, just continue with stored data
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        // Clear potentially corrupted auth data
        authService.logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      return response.user;
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  // Check if user has access to a specific site
  const hasAccessToSite = (siteName) => {
    return authService.hasAccessToSite(user, siteName);
  };

  // Add isAuthenticated helper property
  const isAuthenticated = !!user && authService.isAuthenticated();

  const value = {
    user,
    isLoading: loading,
    error,
    login,
    logout,
    clearError,
    hasAccessToSite,
    isAuthenticated,
    checkTokenExpiration
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;