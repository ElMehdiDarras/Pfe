// services/bf2300Service.js
const net = require('net');
const EventEmitter = require('events');
const Alarm = require('../models/alarm');
const Site = require('../models/sites');
const BoxStateManager = require('../utils/boxStateManager');
const boxConfig = require('../config/boxConfig');
const { processAlarmNotification } = require('./socketService');

/**
 * BF2300Service
 * Handles communication with BF-2300 devices using the custom TCP protocol
 */
class BF2300Service extends EventEmitter {
  // Create singleton instance
  static instance = null;
  
  /**
   * Get singleton instance
   * @param {Object} io - Socket.io instance (optional)
   * @returns {BF2300Service} - Singleton instance
   */
  static getInstance(io) {
    if (!BF2300Service.instance) {
      BF2300Service.instance = new BF2300Service();
      if (io) {
        BF2300Service.instance.io = io;
      }
    }
    return BF2300Service.instance;
  }
  
  constructor() {
    super();
    this.boxes = new Map(); // Map of connected boxes by IP address
    this.connectionStatus = new Map(); // Map of connection statuses by IP
    this.connectionAttempts = new Map(); // Track connection attempts
    this.reconnectInterval = parseInt(process.env.BF2300_RECONNECT_INTERVAL) || 30000; // Reconnect every 30 seconds
    this.healthCheckInterval = parseInt(process.env.BF2300_HEALTH_CHECK_INTERVAL) || 60000; // Check health every 60 seconds
    this.maxReconnectAttempts = parseInt(process.env.BF2300_MAX_RECONNECT_ATTEMPTS) || 5; // Maximum reconnect attempts
    this.io = null; // Socket.io instance for notifications
  }
  
  /**
   * Initialize the service and connect to all boxes
   * @param {Object} io - Socket.io instance
   */
  async initialize(io) {
    console.log(`Initializing BF2300Service...`);
    try {
      // Store io instance
      this.io = io;
      
      // Get all sites from the database
      const sites = await Site.find().lean();
      
      if (!sites || sites.length === 0) {
        console.warn('No sites found in database. BF2300Service initialization skipped.');
        return;
      }
      
      console.log(`Found ${sites.length} sites. Starting box connections...`);
      
      // Connect to all boxes from all sites
      for (const site of sites) {
        if (site.boxes && site.boxes.length > 0) {
          for (const box of site.boxes) {
            // Start monitoring this box
            await this.monitorBox(site.name, box);
          }
        }
      }
      
      // Start health check interval
      this.healthCheckIntervalId = setInterval(() => this.performHealthChecks(), this.healthCheckInterval);
      
      console.log('BF2300Service initialized successfully.');
    } catch (error) {
      console.error('Error initializing BF2300Service:', error);
      throw error;
    }
  }

  /**
   * Monitor a specific box
   * @param {string} siteName - Name of the site
   * @param {Object} box - Box configuration
   */
  async monitorBox(siteName, box) {
    try {
      console.log(`Setting up monitoring for box ${box.name} at ${box.ip}:${box.port || 50000}...`);
      
      // Initialize connection status and attempts
      this.connectionStatus.set(box.ip, 'CONNECTING');
      this.connectionAttempts.set(box.ip, 0);
      
      // Start the connection
      this.connectToBox(siteName, box);
      
      return true;
    } catch (error) {
      console.error(`Error setting up monitoring for box ${box.name}:`, error);
      return false;
    }
  }

  /**
   * Connect to a specific box
   * @param {string} siteName - Name of the site
   * @param {Object} box - Box configuration
   */
  async connectToBox(siteName, box) {
    try {
      console.log(`Connecting to box ${box.name} at ${box.ip}:${box.port || 50000}...`);
      
      // Create TCP socket
      const socket = new net.Socket();
      
      // Set timeout
      socket.setTimeout(10000); // 10 seconds timeout
      
      // Set up event handlers
      socket.on('connect', () => {
        console.log(`Connected to box ${box.name} at ${box.ip}`);
        this.connectionStatus.set(box.ip, 'UP');
        this.connectionAttempts.set(box.ip, 0);
        this.boxes.set(box.ip, { socket, site: siteName, box, buffer: Buffer.alloc(0) });
        
        // Update box status in database via BoxStateManager
        BoxStateManager.updateBoxState(siteName, box.name, 'UP', this.io);
        
        // Emit event
        this.emit('boxConnected', { siteId: siteName, boxId: box.name, ip: box.ip });
      });
      
      socket.on('data', (data) => {
        this.handleData(box.ip, data);
      });
      
      socket.on('close', () => {
        console.log(`Connection closed for box ${box.name} at ${box.ip}`);
        
        // If we were previously connected, mark as DOWN and try to reconnect
        if (this.connectionStatus.get(box.ip) === 'UP') {
          this.connectionStatus.set(box.ip, 'DOWN');
          
          // Update box status in database via BoxStateManager
          BoxStateManager.updateBoxState(siteName, box.name, 'DOWN', this.io);
          
          // Emit event
          this.emit('boxDisconnected', { siteId: siteName, boxId: box.name, ip: box.ip });
          
          // Schedule reconnection
          setTimeout(() => {
            this.reconnectToBox(siteName, box);
          }, this.reconnectInterval);
        }
        
        // Remove from connected boxes
        this.boxes.delete(box.ip);
      });
      
      socket.on('error', (err) => {
        console.error(`Socket error for box ${box.name} at ${box.ip}:`, err.message);
        
        // Do not try to close the socket here, as it might trigger another error
        // The 'close' event will handle cleanup
      });
      
      socket.on('timeout', () => {
        console.warn(`Connection timeout for box ${box.name} at ${box.ip}`);
        socket.destroy();
      });
      
      // Connect to the box
      const port = box.port || 50000;
      socket.connect(port, box.ip);
      
    } catch (error) {
      console.error(`Error connecting to box ${box.name} at ${box.ip}:`, error);
      
      // Mark as DOWN
      this.connectionStatus.set(box.ip, 'DOWN');
      
      // Update box status in database via BoxStateManager
      BoxStateManager.updateBoxState(siteName, box.name, 'DOWN', this.io);
      
      // Schedule reconnection
      setTimeout(() => {
        this.reconnectToBox(siteName, box);
      }, this.reconnectInterval);
    }
  }

  /**
   * Reconnect to a box
   * @param {string} siteName - Name of the site
   * @param {Object} box - Box configuration
   */
  async reconnectToBox(siteName, box) {
    // Increment connection attempts
    const attempts = (this.connectionAttempts.get(box.ip) || 0) + 1;
    this.connectionAttempts.set(box.ip, attempts);
    
    console.log(`Reconnection attempt ${attempts}/${this.maxReconnectAttempts} for box ${box.name} at ${box.ip}`);
    
    // If max attempts reached, mark as UNREACHABLE
    if (attempts >= this.maxReconnectAttempts) {
      console.warn(`Box ${box.name} at ${box.ip} is UNREACHABLE after ${attempts} attempts`);
      this.connectionStatus.set(box.ip, 'UNREACHABLE');
      
      // Update box status in database via BoxStateManager
      BoxStateManager.updateBoxState(siteName, box.name, 'UNREACHABLE', this.io);
      
      // Emit event
      this.emit('boxUnreachable', { siteId: siteName, boxId: box.name, ip: box.ip });
      
      // Reset attempts and retry after longer interval
      this.connectionAttempts.set(box.ip, 0);
      setTimeout(() => {
        this.reconnectToBox(siteName, box);
      }, this.reconnectInterval * 2);
      
      return;
    }
    
    // Try to connect again
    this.connectToBox(siteName, box);
  }

  /**
   * Handle incoming data from a box
   * @param {string} ip - IP address of the box
   * @param {Buffer} data - Received data
   */
  handleData(ip, data) {
    const boxInfo = this.boxes.get(ip);
    if (!boxInfo) {
      console.warn(`Received data from unknown box at ${ip}`);
      return;
    }
    
    // Append data to buffer
    boxInfo.buffer = Buffer.concat([boxInfo.buffer, data]);
    
    // Process packets in buffer
    this.processBufferedData(ip);
  }

  /**
   * Process complete packets in the buffer
   * @param {string} ip - IP address of the box
   */
  processBufferedData(ip) {
    const boxInfo = this.boxes.get(ip);
    if (!boxInfo) return;
    
    // BF-2300 packet structure:
    // Start Flag (0xF0F0, 2 bytes) + Command (2 bytes) + Data1 (32 bytes) + Data2 (32 bytes) + End Flag (0xF0F0, 2 bytes) + CRC (1 byte)
    // Total: 71 bytes minimum
    
    while (boxInfo.buffer.length >= 71) {
      // Check for start flag (0xF0F0)
      if (boxInfo.buffer.readUInt16BE(0) !== 0xF0F0) {
        // Invalid start, shift by one byte and try again
        boxInfo.buffer = boxInfo.buffer.slice(1);
        continue;
      }
      
      // Check if we have at least one complete packet
      if (boxInfo.buffer.length < 71) {
        // Not enough data yet, wait for more
        break;
      }
      
      // Check for end flag (0xF0F0) at expected position
      if (boxInfo.buffer.readUInt16BE(68) !== 0xF0F0) {
        // Invalid packet, shift and try again
        boxInfo.buffer = boxInfo.buffer.slice(1);
        continue;
      }
      
      // Extract the packet
      const packet = boxInfo.buffer.slice(0, 71);
      boxInfo.buffer = boxInfo.buffer.slice(71);
      
      // Verify CRC
      const receivedCrc = packet[70];
      const calculatedCrc = this.calculateCRC(packet.slice(0, 70));
      
      if (receivedCrc !== calculatedCrc) {
        console.warn(`CRC check failed for packet from ${boxInfo.box.name} at ${ip}. Received: ${receivedCrc}, Calculated: ${calculatedCrc}`);
        continue; // Skip this packet
      }
      
      // Process the packet
      this.processPacket(ip, packet);
    }
  }

  /**
   * Process a complete packet
   * @param {string} ip - IP address of the box
   * @param {Buffer} packet - Complete packet
   */
  processPacket(ip, packet) {
    const boxInfo = this.boxes.get(ip);
    if (!boxInfo) return;
    
    try {
      // Extract command code
      const command = packet.readUInt16BE(2);
      
      // Extract data portions
      const data1 = packet.slice(4, 36);  // 32 bytes
      const data2 = packet.slice(36, 68); // 32 bytes
      
      // Process based on command type
      switch (command) {
        case 0x0001: // Read Digital I/O state response
          this.handleDigitalIOState(boxInfo, data1, data2);
          break;
        
        case 0x0010: // Auto report I/O state
          this.handleAutoReport(boxInfo, data1, data2);
          break;
        
        default:
          console.log(`Received unknown command ${command.toString(16)} from ${boxInfo.box.name || 'unknown box'} at ${ip}`);
          break;
      }
      
    } catch (error) {
      console.error(`Error processing packet from ${ip}:`, error);
    }
  }

  /**
   * Handle Digital I/O state data
   * @param {Object} boxInfo - Box information
   * @param {Buffer} data1 - Input data (32 bytes)
   * @param {Buffer} data2 - Output data (32 bytes)
   */
  handleDigitalIOState(boxInfo, data1, data2) {
    console.log(`Received Digital I/O state from ${boxInfo.box.name || 'unknown box'} at ${boxInfo.box?.ip || 'unknown IP'}`);
    
    // Parse input states
    const inputStates = [];
    for (let i = 0; i < 12; i++) { // Assuming 12 inputs as per documentation
      inputStates.push(data1[i] === 1);
    }
    
    // Parse output states
    const outputStates = [];
    for (let i = 0; i < 6; i++) { // Assuming 6 outputs as per documentation
      outputStates.push(data2[i] === 1);
    }
    
    console.log(`Box ${boxInfo.box.name} inputs:`, inputStates);
    console.log(`Box ${boxInfo.box.name} outputs:`, outputStates);
    
    // Process alarm states
    this.processAlarms(boxInfo, inputStates);
  }

  /**
   * Handle auto-reported I/O state changes
   * @param {Object} boxInfo - Box information
   * @param {Buffer} data1 - Input data (32 bytes)
   * @param {Buffer} data2 - Output data (32 bytes)
   */
  handleAutoReport(boxInfo, data1, data2) {
    console.log(`Received auto-reported I/O state from ${boxInfo.box.name || 'unknown box'} at ${boxInfo.box?.ip || 'unknown IP'}`);
    
    // Parse input states
    const inputStates = [];
    for (let i = 0; i < 12; i++) { // Assuming 12 inputs as per documentation
      inputStates.push(data1[i] === 1);
    }
    
    // Parse output states
    const outputStates = [];
    for (let i = 0; i < 6; i++) { // Assuming 6 outputs as per documentation
      outputStates.push(data2[i] === 1);
    }
    
    // Process alarm states
    this.processAlarms(boxInfo, inputStates);
  }

  /**
   * Process alarms based on input states
   * @param {Object} boxInfo - Box information
   * @param {Array} inputStates - Array of boolean input states
   */
  async processAlarms(boxInfo, inputStates) {
    try {
      const siteName = boxInfo.site;
      const boxName = boxInfo.box.name;
      const boxIP = boxInfo.box.ip;
      
      // Get site and box configuration
      const siteConfig = boxConfig.getConfigForSite(siteName);
      if (!siteConfig) {
        console.warn(`No configuration found for site ${siteName}`);
        return;
      }
      
      const boxConf = siteConfig.boxes.find(b => b.id === boxName || b.ip === boxIP);
      if (!boxConf) {
        console.warn(`No configuration found for box ${boxName} (${boxIP}) in site ${siteName}`);
        return;
      }
      
      // Process each pin
      for (let i = 0; i < inputStates.length; i++) {
        const pinNumber = i + 1; // 1-based pin numbers
        const pinState = inputStates[i] ? 1 : 0;
        
        // Find pin configuration
        const pinConfig = boxConf.pins.find(p => p.pin === pinNumber);
        if (!pinConfig) continue; // Skip unconfigured pins
        
        // Default to normally open (0=normal, 1=alarm)
        const isAlarmCondition = pinConfig.normallyOpen ? 
          (pinState === 1) : (pinState === 0);
        
        // Determine alarm status
        const alarmStatus = isAlarmCondition ? pinConfig.severity : 'OK';
        
        // Find existing alarm for this pin
        const existingAlarm = await Alarm.findOne({
          siteId: siteName,
          boxId: boxName,
          pinId: pinNumber.toString(),
          status: { $ne: 'OK' } // Only active alarms - replacing resolvedAt check
        });
        
        if (isAlarmCondition) {
          // Create or update alarm
          if (existingAlarm) {
            // Only update if status changed
            if (existingAlarm.status !== alarmStatus) {
              existingAlarm.status = alarmStatus;
              existingAlarm.statusHistory.push({
                status: alarmStatus,
                timestamp: new Date()
              });
              
              await existingAlarm.save();
              
              console.log(`Updated alarm for ${siteName}, box: ${boxName}, pin: ${pinNumber} to ${alarmStatus}`);
              
              // Emit event
              if (this.io) {
                // Send notification with context of previous status
                const alarmWithContext = {
                  ...existingAlarm.toObject(),
                  previousStatus: existingAlarm.statusHistory[existingAlarm.statusHistory.length - 2]?.status
                };
                processAlarmNotification(alarmWithContext, this.io);
              }
              
              this.emit('alarmUpdated', existingAlarm);
            }
          } else {
            // Create new alarm
            const newAlarm = new Alarm({
              siteId: siteName,
              boxId: boxName,
              pinId: pinNumber.toString(),
              equipment: pinConfig.equipment,
              description: pinConfig.description,
              status: alarmStatus,
              timestamp: new Date(),
              statusHistory: [{
                status: alarmStatus,
                timestamp: new Date()
              }]
            });
            
            await newAlarm.save();
            
            console.log(`Created new ${alarmStatus} alarm for ${siteName}, box: ${boxName}, pin: ${pinNumber}`);
            
            // Emit event
            if (this.io) {
              processAlarmNotification(newAlarm, this.io);
            }
            
            this.emit('alarmCreated', newAlarm);
          }
        } else if (existingAlarm) {
          // Update alarm to OK status (instead of setting resolvedAt)
          existingAlarm.status = 'OK';
          existingAlarm.statusHistory.push({
            status: 'OK',
            timestamp: new Date()
          });
          
          await existingAlarm.save();
          
          console.log(`Set alarm to OK for ${siteName}, box: ${boxName}, pin: ${pinNumber}`);
          
          // Emit event
          if (this.io) {
            // Send notification with context of previous status
            const statusChangedAlarm = {
              ...existingAlarm.toObject(),
              previousStatus: existingAlarm.statusHistory[existingAlarm.statusHistory.length - 2]?.status
            };
            processAlarmNotification(statusChangedAlarm, this.io);
          }
          
          this.emit('alarmResolved', existingAlarm);
        }
      }
      
      // Update site and equipment status
      await this.updateSiteEquipmentStatus(siteName);
      
    } catch (error) {
      console.error(`Error processing alarms for ${boxInfo.box?.name || 'unknown box'}:`, error);
    }
  }

  /**
   * Update equipment status in site based on active alarms
   * @param {string} siteName - Site name
   */
  async updateSiteEquipmentStatus(siteName) {
    try {
      // Get all active alarms for this site
      const activeAlarms = await Alarm.find({
        siteId: siteName,
        status: { $ne: 'OK' }, // Instead of resolvedAt null
        ignored: false
      });
      
      // Get site with equipment
      const site = await Site.findOne({ name: siteName });
      if (!site) return;
      
      // Update each equipment based on alarms
      for (const equipment of site.equipment) {
        // Find alarms for this equipment
        const alarms = activeAlarms.filter(a => a.equipment === equipment.name);
        
        if (alarms.length > 0) {
          // Determine worst status
          let worstStatus = 'OK';
          
          for (const alarm of alarms) {
            if (alarm.status === 'CRITICAL') {
              worstStatus = 'CRITICAL';
              break;
            } else if (alarm.status === 'MAJOR' && worstStatus !== 'CRITICAL') {
              worstStatus = 'MAJOR';
            } else if (alarm.status === 'WARNING' && worstStatus !== 'CRITICAL' && worstStatus !== 'MAJOR') {
              worstStatus = 'WARNING';
            }
          }
          
          // Update equipment status
          equipment.status = worstStatus;
        } else {
          // No alarms, equipment is OK
          equipment.status = 'OK';
        }
      }
      
      // Update site status based on equipment status
      let siteStatus = 'OK';
      let activeAlarmCount = 0;
      
      for (const equipment of site.equipment) {
        if (equipment.status !== 'OK' && equipment.status !== 'UNREACHABLE') {
          activeAlarmCount++;
          
          if (equipment.status === 'CRITICAL') {
            siteStatus = 'CRITICAL';
          } else if (equipment.status === 'MAJOR' && siteStatus !== 'CRITICAL') {
            siteStatus = 'MAJOR';
          } else if (equipment.status === 'WARNING' && siteStatus !== 'CRITICAL' && siteStatus !== 'MAJOR') {
            siteStatus = 'WARNING';
          }
        }
      }
      
      // Update site status and active alarm count
      site.status = siteStatus;
      site.activeAlarms = activeAlarmCount;
      
      // Save site
      await site.save();
      
      console.log(`Updated site ${siteName} status to ${siteStatus} with ${activeAlarmCount} active alarms`);
    } catch (error) {
      console.error(`Error updating equipment status for site ${siteName}:`, error);
    }
  }

  /**
   * Perform health checks on all connected boxes
   */
  performHealthChecks() {
    for (const [ip, boxInfo] of this.boxes.entries()) {
      this.sendHealthCheck(ip);
    }
  }

  /**
   * Send health check to a box
   * @param {string} ip - IP address of the box
   */
  sendHealthCheck(ip) {
    const boxInfo = this.boxes.get(ip);
    if (!boxInfo) return;
    
    try {
      // Create a read digital I/O command
      // Start Flag (0xF0F0) + Command (0x0001) + Data1 (32 bytes of 0) + Data2 (32 bytes of 0) + End Flag (0xF0F0) + CRC (1 byte)
      const packet = Buffer.alloc(71);
      
      // Set start flag
      packet.writeUInt16BE(0xF0F0, 0);
      
      // Set command (Read Digital I/O)
      packet.writeUInt16BE(0x0001, 2);
      
      // Data1 and Data2 are already zeros
      
      // Set end flag
      packet.writeUInt16BE(0xF0F0, 68);
      
      // Calculate and set CRC
      const crc = this.calculateCRC(packet.slice(0, 70));
      packet[70] = crc;
      
      // Send packet
      boxInfo.socket.write(packet, (err) => {
        if (err) {
          console.error(`Error sending health check to ${boxInfo.box.name} at ${ip}:`, err.message);
        }
      });
      
    } catch (error) {
      console.error(`Error creating health check packet for ${ip}:`, error);
    }
  }

  /**
   * Calculate CRC checksum according to BF-2300 protocol
   * @param {Buffer} data - Data to calculate CRC for
   * @returns {number} - CRC value
   */
  calculateCRC(data) {
    // CRC is the total sum of all bytes modulo 256 (8-bit)
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc = (crc + data[i]) & 0xFF;
    }
    return crc;
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down BF2300Service...');
    
    // Clear health check interval
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
    }
    
    // Disconnect all boxes
    for (const [ip, boxInfo] of this.boxes.entries()) {
      try {
        boxInfo.socket.destroy();
      } catch (error) {
        console.error(`Error disconnecting box at ${ip}:`, error);
      }
    }
    
    // Clear maps
    this.boxes.clear();
    this.connectionStatus.clear();
    this.connectionAttempts.clear();
    
    console.log('BF2300Service shut down.');
  }
}

// Export singleton instance getter
module.exports = BF2300Service.getInstance;