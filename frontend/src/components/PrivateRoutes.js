import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
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
  
  // Extract site ID directly from URL path
  const urlParts = location.pathname.split('/');
  const siteIndex = urlParts.findIndex(part => part === 'sites');
  const siteId = siteIndex >= 0 && urlParts.length > siteIndex + 1 ? urlParts[siteIndex + 1] : null;
  
  // Log all info for debugging
  console.log('SiteRoute - Current URL:', location.pathname);
  console.log('SiteRoute - URL parts:', urlParts);
  console.log('SiteRoute - Site index:', siteIndex);
  console.log('SiteRoute - Raw site ID from URL:', siteId);
  console.log('SiteRoute - Current user:', currentUser);
  console.log('SiteRoute - User sites:', currentUser?.sites);
  
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
  
  if (!siteId) {
    return <Navigate to="/dashboard" />;
  }
  
  // Admins and supervisors can access all sites
  if (currentUser.role === 'administrator' || currentUser.role === 'supervisor') {
    console.log('User is admin/supervisor - allowing access to all sites');
    return <Outlet />;
  }
  
  // For agents, check site access with special handling of site IDs
  const hasAccess = canAccessSite(siteId);
  console.log('Agent site access check result:', hasAccess);
  
  // If user has access, allow access; otherwise, redirect to unauthorized
  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" />;
};

export default PrivateRoute;