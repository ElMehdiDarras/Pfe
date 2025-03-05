import axios from 'axios';

// Configuration for MongoDB API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

/**
 * Service for interacting with MongoDB backend to fetch and process alarm data
 */
class MongoDBService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Site definitions as fallback if API fails
    this.siteDefinitions = [
      {
        id: 'Rabat-Hay-NAHDA',
        name: 'Rabat-Hay NAHDA',
        vlan: '610',
        location: 'Rabat',
        ipRange: '10.29.133.0/24',
        description: 'Site Type 1 à Hay NAHDA'
      },
      {
        id: 'Rabat-Soekarno',
        name: 'Rabat-Soekarno',
        vlan: '620',
        location: 'Rabat',
        ipRange: '10.29.136.0/24',
        description: 'Site Type 1 à Soekarno'
      },
      {
        id: 'Casa-Nations-Unies',
        name: 'Casa-Nations Unies',
        vlan: '630',
        location: 'Casablanca',
        ipRange: '10.29.139.0/24',
        description: 'Site Type 2 à Nations Unies'
      }
    ];
  }

  /**
   * Fetches all sites with their current status
   * @returns {Promise<Array>} Array of site objects
   */
  async fetchSites() {
    try {
      const response = await this.axios.get('/sites');
      console.log('Sites response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching sites:', error);
      return this.siteDefinitions;
    }
  }

  /**
   * Fetch a specific site by ID
   * @param {string} siteId - Site identifier
   * @returns {Promise<Object>} Site object with details
   */
  async fetchSite(siteId) {
    try {
      const response = await this.axios.get(`/sites/name/${siteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching site ${siteId}:`, error);
      // Return a fallback site from definitions
      return this.siteDefinitions.find(site => 
        site.id === siteId || site.name === siteId
      ) || null;
    }
  }

  /**
   * Fetches boxes for a specific site
   * @param {string} siteId - Site identifier
   * @returns {Promise<Array>} Array of box objects for the site
   */
  async fetchBoxesForSite(siteId) {
    try {
      const siteResponse = await this.fetchSite(siteId);
      return siteResponse.boxes || [];
    } catch (error) {
      console.error(`Error fetching boxes for site ${siteId}:`, error);
      return [];
    }
  }

  /**
   * Fetches equipment for a specific site
   * @param {string} siteId - Site identifier
   * @returns {Promise<Array>} Array of equipment objects for the site
   */
  async fetchEquipmentForSite(siteId) {
    try {
      const siteResponse = await this.fetchSite(siteId);
      return siteResponse.equipment || [];
    } catch (error) {
      console.error(`Error fetching equipment for site ${siteId}:`, error);
      return [];
    }
  }

  /**
   * Fetches all active alarms
   * @returns {Promise<Array>} Array of active alarm objects
   */
  async fetchActiveAlarms() {
    try {
      const response = await this.axios.get('/alarms/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active alarms:', error);
      return [];
    }
  }

  /**
   * Fetches all alarms (with pagination if supported by API)
   * @returns {Promise<Array>} Array of alarm objects
   */
  async fetchAlarmHistory() {
    try {
      const response = await this.axios.get('/alarms');
      // Handle both array response and paginated response
      return response.data.alarms || response.data;
    } catch (error) {
      console.error('Error fetching alarm history:', error);
      return [];
    }
  }

  /**
   * Fetches statistics and metrics for dashboard
   * @returns {Promise<Object>} Statistics object
   */
  async fetchStatistics() {
    try {
      const response = await this.axios.get('/alarms/statistics');
      
      // Return summary data if available, or create stats from scratch
      if (response.data && response.data.summary) {
        return {
          critical: response.data.summary.critical || 0,
          major: response.data.summary.major || 0,
          warning: response.data.summary.warning || 0,
          ok: response.data.summary.ok || 0
        };
      }
      
      // Fallback - get counts from active alarms
      const activeAlarms = await this.fetchActiveAlarms();
      return {
        critical: activeAlarms.filter(a => a.status === 'CRITICAL').length,
        major: activeAlarms.filter(a => a.status === 'MAJOR').length,
        warning: activeAlarms.filter(a => a.status === 'WARNING').length,
        ok: 0
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      
      // Second fallback
      try {
        const activeAlarms = await this.fetchActiveAlarms();
        return {
          critical: activeAlarms.filter(a => a.status === 'CRITICAL').length,
          major: activeAlarms.filter(a => a.status === 'MAJOR').length,
          warning: activeAlarms.filter(a => a.status === 'WARNING').length,
          ok: 0
        };
      } catch (fallbackError) {
        console.error('Error with fallback statistics:', fallbackError);
        return { critical: 0, major: 0, warning: 0, ok: 0 };
      }
    }
  }

  /**
   * Fetches hourly alarm data for the last 24 hours
   * @returns {Promise<Array>} Time series data for last 24 hours
   */
  async fetchLast24HoursData() {
    try {
      const response = await this.axios.get('/alarms/statistics');
      
      // If the API returns the hourly data, use it
      if (response.data && response.data.last24Hours) {
        return response.data.last24Hours;
      }
      
      // Otherwise create empty hourly data
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        hourlyData.push({
          hour: `${i}h`,
          critical: 0,
          major: 0,
          warning: 0
        });
      }
      return hourlyData;
    } catch (error) {
      console.error('Error fetching 24 hour data:', error);
      
      // Fallback - create empty hourly data
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        hourlyData.push({
          hour: `${i}h`,
          critical: 0,
          major: 0,
          warning: 0
        });
      }
      return hourlyData;
    }
  }

  /**
   * Acknowledges an alarm
   * @param {string} alarmId - ID of the alarm to acknowledge
   * @returns {Promise<boolean>} Success status
   */
  async acknowledgeAlarm(alarmId) {
    try {
      const response = await this.axios.post(`/alarms/${alarmId}/acknowledge`, {
        userId: 'user' // Replace with actual user ID if available
      });
      return response.data.success === true;
    } catch (error) {
      console.error(`Error acknowledging alarm ${alarmId}:`, error);
      return false;
    }
  }

  /**
   * Fetches filtered alarms based on provided filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Filtered array of alarms
   */
  async fetchFilteredAlarms(filters = {}) {
    try {
      // Convert filter object to query string
      const queryParams = new URLSearchParams();
      if (filters.siteId) queryParams.append('siteId', filters.siteId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.equipment) queryParams.append('equipment', filters.equipment);
      
      const response = await this.axios.get(`/alarms/filter?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching filtered alarms:', error);
      return [];
    }
  }

  /**
   * Fetches all data needed for the dashboard display
   * @returns {Promise<Object>} Complete data for dashboard
   */
  async fetchAllData() {
    try {
      console.log('Fetching all data from MongoDB API');
      
      // Fetch basic data
      const [sites, alarms, activeAlarms, statisticsData] = await Promise.all([
        this.fetchSites(),
        this.fetchAlarmHistory(),
        this.fetchActiveAlarms(),
        this.fetchStatistics()
      ]);
      
      // Fetch last 24 hours data
      const last24HoursData = await this.fetchLast24HoursData();
      
      console.log('Data fetched successfully:', {
        sites: sites.length,
        activeAlarms: activeAlarms.length,
        alarms: alarms.length
      });
      
      return {
        sites,
        activeAlarms,
        alarms,
        statistics: statisticsData,
        last24HoursData
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      throw error;
    }
  }
}

// Create an instance of the service
const mongoDBService = new MongoDBService();

// Export the instance
export default mongoDBService;