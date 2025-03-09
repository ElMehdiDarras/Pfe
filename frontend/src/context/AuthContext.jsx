// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../api/services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = authService.getUser();
        
        if (storedUser && authService.isAuthenticated()) {
          // Set user from local storage
          setUser(storedUser);
          
          try {
            // Refresh user data from backend
            const freshUserData = await authService.getCurrentUser();
            setUser(freshUserData);
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
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Check if user has access to a specific site
  const hasAccessToSite = (siteName) => {
    return authService.hasAccessToSite(user, siteName);
  };

  const value = {
    user,
    isLoading: loading,
    error,
    login,
    logout,
    hasAccessToSite
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};