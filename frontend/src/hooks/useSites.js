// src/hooks/useSites.js
import { useQuery } from '@tanstack/react-query';
import siteService from '../api/services/SiteService';
import { useAuth } from '../context/AuthContext';

// Fetch all sites
export const useSites = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sites', user?.role, user?.sites],
    queryFn: async () => {
      try {
        // Get all sites from API (the API will filter based on user role/permissions)
        const sites = await siteService.getAllSites();
        
        // For extra safety, filter sites on client side as well if user is an agent
        if (user && user.role === 'agent' && user.sites && user.sites.length > 0) {
          return sites.filter(site => user.sites.includes(site.name));
        }
        
        return sites;
      } catch (error) {
        console.error('Error fetching sites:', error);
        throw error;
      }
    },
    enabled: !!user // Only run query if user is logged in
  });
};

// In hooks/useSites.js
export const useSiteById = (siteId) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sites', siteId],
    queryFn: async () => {
      try {
        const site = await siteService.getSiteById(siteId);
        
        return site;
      } catch (error) {
        console.error(`Error fetching site ${siteId}:`, error);
        throw error;
      }
    },
    enabled: !!siteId && !!user,
    retry: (failureCount, error) => {
      // Don't retry on 403 errors - these won't be resolved by retrying
      if (error.response?.status === 403) {
        return false;
      }
      
      // Retry other errors a few times
      return failureCount < 2;
    }
  });
};
// Get site summary for dashboard
export const useSiteSummary = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sites', 'summary', user?.role, user?.sites],
    queryFn: async () => {
      try {
        // Get site summary from API
        const sites = await siteService.getSiteSummary();
        
        // Filter sites on client side if user is an agent
        if (user && user.role === 'agent' && user.sites && user.sites.length > 0) {
          return sites.filter(site => user.sites.includes(site.name));
        }
        
        return sites;
      } catch (error) {
        console.error('Error fetching site summary:', error);
        throw error;
      }
    },
    enabled: !!user
  });
};

export default useSites;