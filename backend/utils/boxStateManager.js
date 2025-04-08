// utils/boxStateManager.js
const Site = require('../models/sites');
const { processAlarmNotification } = require('../services/socketService');

/**
 * Manage box state transitions and related events
 */
class BoxStateManager {
  /**
   * Normalize a name by removing spaces, underscores, and dashes, and converting to lowercase
   * @param {String} name - Name to normalize
   * @returns {String} Normalized name
   */
  static normalizeName(name) {
    if (!name) return '';
    return name.toString().replace(/[\s_-]/g, '').toLowerCase();
  }

  /**
   * Find a box by site name and box name/id, with better name matching
   * @param {String} siteId - Site name or identifier
   * @param {String} boxId - Box name or identifier
   * @returns {Object} Object containing site and box if found, or null
   */
  static async findBoxBySiteAndBoxId(siteId, boxId) {
    try {
      // Normalize the site ID and box ID for comparison
      const normalizedSiteId = this.normalizeName(siteId);
      const normalizedBoxId = this.normalizeName(boxId);
      
      console.log(`Looking for box (normalized): ${normalizedBoxId} in site ${normalizedSiteId}`);
      
      // Find all sites
      const sites = await Site.find();
      
      // Look for matching site
      for (const site of sites) {
        if (this.normalizeName(site.name) === normalizedSiteId) {
          // Found matching site, now look for box
          for (const box of site.boxes) {
            if (this.normalizeName(box.name) === normalizedBoxId || 
                (box._id && this.normalizeName(box._id.toString()) === normalizedBoxId)) {
              console.log(`Found matching box: ${box.name} in site ${site.name}`);
              return { site, box };
            }
          }
          
          // Site found but box not found
          console.error(`Box not found: ${boxId} in site ${site.name} (normalized: ${normalizedBoxId})`);
          // Since we found the site, we can stop looking
          return { site, box: null };
        }
      }
      
      console.error(`Site not found: ${siteId} (normalized: ${normalizedSiteId})`);
      return null;
    } catch (error) {
      console.error(`Error finding box:`, error);
      return null;
    }
  }

  /**
   * Update box state and trigger notifications if changed
   * @param {String} siteId - Site identifier
   * @param {String} boxId - Box identifier
   * @param {String} newState - New state (UP, DOWN, UNREACHABLE)
   * @param {Object} io - Socket.io instance for notifications
   */
  static async updateBoxState(siteId, boxId, newState, io) {
    try {
      // Use the new lookup method
      const result = await this.findBoxBySiteAndBoxId(siteId, boxId);
      
      if (!result) {
        console.error(`Site and box not found: ${boxId} in site ${siteId}`);
        return false;
      }
      
      const { site, box } = result;
      
      if (!box) {
        console.error(`Box not found: ${boxId} in site ${siteId}`);
        return false;
      }
      
      // Check if state has changed
      const oldState = box.status;
      if (oldState === newState) {
        return false; // No change
      }
      
      // Update state
      box.status = newState;
      box.lastSeen = new Date();
      await site.save();
      
      console.log(`Box ${box.name} in site ${site.name} changed state: ${oldState} -> ${newState}`);
      
      // Create notification for state change
      if (io) {
        // Emit socket event
        io.to('all-sites').emit('box-status-change', {
          siteId: site.name,
          boxId: box.name,
          oldState,
          newState,
          timestamp: new Date()
        });
        
        // Create system notification
        const alarmData = {
          siteId: site.name,
          boxId: box.name,
          equipment: `Box ${box.name}`,
          description: `Box state changed from ${oldState} to ${newState}`,
          status: newState === 'UP' ? 'OK' : (newState === 'DOWN' ? 'MAJOR' : 'CRITICAL'),
          timestamp: new Date()
        };
        
        await processAlarmNotification(alarmData, io);
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating box state:`, error);
      return false;
    }
  }
  
  /**
   * Get current state of all boxes
   * @returns {Array} Array of box states with site info
   */
  static async getAllBoxStates() {
    try {
      const sites = await Site.find().select('name boxes');
      const boxStates = [];
      
      sites.forEach(site => {
        site.boxes.forEach(box => {
          boxStates.push({
            siteId: site.name,
            boxId: box._id,
            boxName: box.name,
            status: box.status,
            lastSeen: box.lastSeen,
            ip: box.ip,
            port: box.port
          });
        });
      });
      
      return boxStates;
    } catch (error) {
      console.error('Error getting box states:', error);
      return [];
    }
  }
  
  /**
   * Get boxes in specific state
   * @param {String} state - State to filter by (UP, DOWN, UNREACHABLE)
   * @returns {Array} Filtered box states
   */
  static async getBoxesByState(state) {
    const allStates = await this.getAllBoxStates();
    return allStates.filter(box => box.status === state);
  }
}

module.exports = BoxStateManager;