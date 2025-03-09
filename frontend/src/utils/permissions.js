// src/utils/permissions.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Permission constants
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',
  VIEW_MONITORING: 'VIEW_MONITORING',
  VIEW_STATISTICS: 'VIEW_STATISTICS',
  VIEW_CONFIGURATION: 'VIEW_CONFIGURATION',
  VIEW_CARTES: 'VIEW_CARTES',
  VIEW_HISTORIQUE: 'VIEW_HISTORIQUE',
  MANAGE_SITES: 'MANAGE_SITES',
  MANAGE_USERS: 'MANAGE_USERS',
  ACKNOWLEDGE_ALARMS: 'ACKNOWLEDGE_ALARMS',
  GENERATE_REPORTS: 'GENERATE_REPORTS'
};

// Role permission mappings
const ROLE_PERMISSIONS = {
  administrator: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONITORING,
    PERMISSIONS.VIEW_STATISTICS,
    PERMISSIONS.VIEW_CONFIGURATION,
    PERMISSIONS.VIEW_CARTES,
    PERMISSIONS.VIEW_HISTORIQUE,
    PERMISSIONS.MANAGE_SITES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ACKNOWLEDGE_ALARMS,
    PERMISSIONS.GENERATE_REPORTS
  ],
  supervisor: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONITORING,
    PERMISSIONS.VIEW_STATISTICS,
    PERMISSIONS.VIEW_CARTES,
    PERMISSIONS.VIEW_HISTORIQUE,
    PERMISSIONS.ACKNOWLEDGE_ALARMS,
    PERMISSIONS.GENERATE_REPORTS
  ],
  agent: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONITORING,
    PERMISSIONS.ACKNOWLEDGE_ALARMS
  ]
};

// Check if user has permission
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

// Hook to check permission and redirect if needed
export const usePermission = (requiredPermission) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (requiredPermission && !hasPermission(user, requiredPermission)) {
      navigate('/unauthorized', { replace: true });
    }
  }, [user, requiredPermission, navigate]);
  
  return {
    hasPermission: (permission) => hasPermission(user, permission),
    user
  };
};

// Route protection component
export const ProtectedRoute = ({ children, requiredPermission }) => {
  const { hasPermission } = usePermission(requiredPermission);
  
  // If no specific permission is required, or user has the permission
  if (!requiredPermission || hasPermission(requiredPermission)) {
    return children;
  }
  
  return null;
};


// Enhanced hasSiteAccess in permissions.js
export const hasSiteAccess = (user, siteName) => {
  if (!user) return false;
  
  // Admin and supervisor have access to all sites
  if (user.role === 'administrator' || user.role === 'supervisor') {
    return true;
  }
  
  // If no siteName provided or user has no sites, deny access
  if (!siteName || !user.sites || !Array.isArray(user.sites)) {
    return false;
  }
  
  // Agent access checks with normalization
  if (user.role === 'agent') {
    // Normalize the requested site name (remove spaces, convert to lowercase)
    const normalizedSiteName = siteName.replace(/[\s-]/g, '').toLowerCase();
    
    // Check if any of the user's sites match after normalization
    const hasAccess = user.sites.some(userSite => {
      const normalizedUserSite = userSite.replace(/[\s-]/g, '').toLowerCase();
      return normalizedSiteName === normalizedUserSite;
    });
    
    return hasAccess;
  }
  
  return false;
};

// Hook to check site access
export const useSiteAccess = (siteName) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (siteName && !hasSiteAccess(user, siteName)) {
      navigate('/unauthorized', { replace: true });
    }
  }, [user, siteName, navigate]);
  
  return {
    hasSiteAccess: (site) => hasSiteAccess(user, site),
    user
  };
};