// services/modbusService.js
const ModbusRTU = require('modbus-serial');
const PinConfiguration = require('../models/pinConfiguration');
const Site = require('../models/sites');
const { handlePinStateChange } = require('./alarmService');

class ModbusService {
  constructor() {
    this.client = new ModbusRTU();
    this.boxPollers = new Map(); // Map of IP addresses to polling intervals
    this.lastStates = new Map(); // Map of IP:pin to last known state
  }
  
  async initialize() {
    try {
      // Load all sites and boxes from database
      const sites = await Site.find().lean();
      
      for (const site of sites) {
        // For each box in the site
        if (site.boxes && site.boxes.length > 0) {
          for (const box of site.boxes) {
            await this.setupBoxPoller(site.name, box.name, box.ip, box.port || 502);
          }
        }
      }
      
      console.log('Modbus service initialized');
    } catch (error) {
      console.error('Failed to initialize Modbus service:', error);
    }
  }
  
  async setupBoxPoller(siteName, boxName, ipAddress, port) {
    try {
      // Skip if we're already polling this box
      if (this.boxPollers.has(ipAddress)) return;
      
      console.log(`Setting up poller for ${siteName}, box: ${boxName}, IP: ${ipAddress}`);
      
      // Find pin configurations for this box
      const pinConfigs = await PinConfiguration.find({
        siteId: siteName,
        boxId: boxName
      }).sort({ pinNumber: 1 }).lean();
      
      if (pinConfigs.length === 0) {
        console.log(`No pin configurations found for ${siteName}, box: ${boxName}`);
        return;
      }
      
      // Create a polling interval for this box
      const intervalId = setInterval(async () => {
        try {
          await this.pollBox(siteName, boxName, ipAddress, port, pinConfigs);
        } catch (error) {
          console.error(`Error polling box ${boxName} at ${ipAddress}:`, error);
        }
      }, 30000);
      
      this.boxPollers.set(ipAddress, intervalId);
      
    } catch (error) {
      console.error(`Error setting up poller for ${ipAddress}:`, error);
    }
  }
  
  async pollBox(siteName, boxName, ipAddress, port, pinConfigs) {
    const client = new ModbusRTU();
    
    try {
      // Connect to the Modbus device
      await client.connectTCP(ipAddress, { port });
      client.setID(1); // Device ID
      
      // Read the digital inputs (Modbus function code 02)
      // Adjust the address and length based on your device
      const result = await client.readDiscreteInputs(0, 16); // Read 16 inputs starting at address 0
      
      if (result && result.data) {
        // Process each pin state
        for (const config of pinConfigs) {
          // Get pin state from the result
          // Modbus arrays are zero-based, so pin 1 is at index 0
          const pinIndex = config.pinNumber - 1;
          if (pinIndex >= 0 && pinIndex < result.data.length) {
            const newState = result.data[pinIndex] ? 1 : 0;
            
            // Create a unique key for this pin
            const pinKey = `${ipAddress}:${config.pinNumber}`;
            
            // Check if state has changed
            if (!this.lastStates.has(pinKey) || this.lastStates.get(pinKey) !== newState) {
              console.log(`Pin state change detected: ${siteName}, box: ${boxName}, pin: ${config.pinNumber}, state: ${newState}`);
              
              // Update last known state
              this.lastStates.set(pinKey, newState);
              
              // Handle the state change
              await handlePinStateChange(siteName, boxName, config.pinNumber, newState, config);
            }
          }
        }
        
        // Mark box as online
        await Site.updateOne(
          { name: siteName, "boxes.name": boxName },
          { $set: { "boxes.$.status": "UP", "boxes.$.lastSeen": new Date() } }
        );
      }
    } catch (error) {
      console.error(`Modbus polling error for ${ipAddress}:`, error);
      
      // Mark box as offline
      await Site.updateOne(
        { name: siteName, "boxes.name": boxName },
        { $set: { "boxes.$.status": "DOWN" } }
      );
    } finally {
      // Always close the connection
      client.close();
    }
  }
  
  stopPolling() {
    // Clear all polling intervals
    for (const intervalId of this.boxPollers.values()) {
      clearInterval(intervalId);
    }
    this.boxPollers.clear();
    console.log('Modbus polling stopped');
  }
}

module.exports = new ModbusService();