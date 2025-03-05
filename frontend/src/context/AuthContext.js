import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize axios default headers with token
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Function to handle login
  const login = (authToken, user) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setCurrentUser(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  // Function to handle logout
  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side cookie if needed
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Check if user is authenticated on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token by getting user info
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Token verification error:', error);
        // If token is invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Function to check if user has a specific role
  const hasRole = (roles) => {
    if (!currentUser) return false;
    if (!Array.isArray(roles)) roles = [roles];
    return roles.includes(currentUser.role);
  };

// Function to check if user has access to a specific site
// Function to check if user has access to a specific site
const canAccessSite = (siteName) => {
  if (!currentUser) return false;
  
  // Admins and supervisors can access all sites
  if (currentUser.role === 'administrator' || currentUser.role === 'supervisor') {
    return true;
  }
  
  // For debugging
  console.log('Checking access to site:', siteName);
  console.log('User sites:', currentUser.sites);
  
  if (!currentUser.sites || !Array.isArray(currentUser.sites)) {
    console.log('User has no sites or sites is not an array');
    return false;
  }
  
  // Handle different formats of site names
  // Normalize both the target siteName and the user's site names
  const normalizedTargetSite = siteName.toLowerCase().trim();
  
  // Check each site in the user's permissions
  for (const userSite of currentUser.sites) {
    // Skip if not a string
    if (typeof userSite !== 'string') continue;
    
    const normalizedUserSite = userSite.toLowerCase().trim();
    
    // Try different formats for comparison
    if (
      normalizedUserSite === normalizedTargetSite || 
      normalizedUserSite.replace(/\s+/g, '-') === normalizedTargetSite ||
      normalizedTargetSite.replace(/-/g, ' ') === normalizedUserSite
    ) {
      console.log(`Match found: "${userSite}" matches "${siteName}"`);
      return true;
    }
  }
  
  console.log(`No match found for "${siteName}" in user's sites`);
  return false;
};
  const value = {
    currentUser,
    token,
    loading,
    login,
    logout,
    hasRole,
    canAccessSite,
    isAdmin: () => hasRole('administrator'),
    isSupervisor: () => hasRole('supervisor'),
    isAgent: () => hasRole('agent')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;