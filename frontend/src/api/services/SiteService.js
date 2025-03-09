// src/api/services/siteService.js
import api from '../axios';

// Site-related API calls
const siteService = {
  // Get all sites (filtered by user permissions)
  getAllSites: async () => {
    try {
      const response = await api.get('/sites');
      return response.data;
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw error;
    }
  },
  
  // Get site summary for dashboard
  getSiteSummary: async () => {
    try {
      const response = await api.get('/sites/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching site summary:', error);
      throw error;
    }
  },
  
// In api/services/SiteService.js
getSiteById: async (id) => {
  try {
    const response = await api.get(`/sites/${id}`);
    return response.data;
  } catch (error) {
    // Check for access denied error
    if (error.response?.status === 403) {
      console.error(`Access denied to site ${id}:`, error.response.data);
      throw new Error('You do not have permission to access this site');
    }
    
    console.error(`Error fetching site ${id}:`, error);
    throw error;
  }
}
};

export default siteService;