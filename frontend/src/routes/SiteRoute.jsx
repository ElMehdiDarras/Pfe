// Modified SiteRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import siteService from '../api/services/SiteService';

// Helper function for normalized site name comparison
const normalizeForComparison = (name) => {
  return name.replace(/[\s-]/g, '').toLowerCase();
};

export const SiteRoute = () => {
  const { siteId } = useParams();
  const { user } = useAuth();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSite = async () => {
      try {
        if (!siteId) {
          setLoading(false);
          return;
        }
        
        const siteData = await siteService.getSiteById(siteId);
        setSite(siteData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching site:', err);
        setError(err);
        setLoading(false);
      }
    };
    
    fetchSite();
  }, [siteId]);

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If error or site not found, redirect to 404
  if (error || !site) {
    return <Navigate to="/not-found" replace />;
  }
  
  // Enhanced site access check with normalization
  const hasAccess = (() => {
    // Admin and supervisor always have access
    if (user.role === 'administrator' || user.role === 'supervisor') {
      return true;
    }
    
    // For agents, check with normalization
    if (user.role === 'agent' && user.sites && site.name) {
      const normalizedSiteName = normalizeForComparison(site.name);
      
      return user.sites.some(userSite => {
        const normalizedUserSite = normalizeForComparison(userSite);
        return normalizedSiteName === normalizedUserSite;
      });
    }
    
    return false;
  })();
  
  // If no access, redirect to unauthorized
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // User is authenticated and has access to site
  return <Outlet />;
};

export default SiteRoute;