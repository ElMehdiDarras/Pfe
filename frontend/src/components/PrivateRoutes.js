import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Component for routes that require authentication
export const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

// Component for routes that require specific roles
export const RoleRoute = ({ allowedRoles }) => {
  const { currentUser, loading, hasRole } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return hasRole(allowedRoles) ? <Outlet /> : <Navigate to="/unauthorized" />;
};

// Component for routes that require site access
export const SiteRoute = ({ siteParam = 'id' }) => {
  const { currentUser, loading, canAccessSite } = useAuth();
  const location = window.location;
  
  // Extract site name from URL
  const urlParts = location.pathname.split('/');
  const siteIndex = urlParts.findIndex(part => part === 'sites');
  const siteId = siteIndex >= 0 && urlParts.length > siteIndex + 1 ? urlParts[siteIndex + 1] : null;
  
  // Handle site ID format - convert from URL format (with dashes) to DB format (with spaces)
  const siteName = siteId ? siteId.replace(/-/g, ' ') : null;
  
  // Log for debugging
  console.log('URL Site ID:', siteId);
  console.log('Normalized Site Name:', siteName);
  console.log('User Sites:', currentUser?.sites);
  console.log('User Role:', currentUser?.role);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!siteName) {
    return <Navigate to="/dashboard" />;
  }
  
  // Check if user can access this site
  const hasAccess = canAccessSite(siteName);
  console.log('Has Access:', hasAccess);
  
  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" />;
};

export default PrivateRoute;