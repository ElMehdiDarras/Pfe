// backend/boxSimulator.js
const net = require('net');
const fs = require('fs');
const boxConfig = require('/home/mhdi/Desktop/alarm-monitoring-system/backend/config/boxConfig.js');
require('dotenv').config();

// Configuration
const STATE_CHANGE_INTERVAL = process.env.SIMULATOR_INTERVAL ? parseInt(process.env.SIMULATOR_INTERVAL) : 30000;
const LOG_TO_FILE = process.env.SIMULATOR_LOG_TO_FILE === 'true';
const LOG_FILE = 'logs/simulator.log';

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Helper to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  if (LOG_TO_FILE) {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  }
}

// Port mapping function - EXACTLY matching the one in bf2300Service.js
// In both files, ensure this function is identical
function calculatePortFromIP(ipAddress) {
  const ipParts = ipAddress.split('.');
  if (ipParts.length !== 4) return 50000;
  const lastOctet = parseInt(ipParts[3]);
  const secondLastOctet = parseInt(ipParts[2]);
  return 50000 + ((secondLastOctet * 100 + lastOctet) % 10000);
}

// Calculate CRC
function calculateCRC(data) {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc = (crc + data[i]) & 0xFF;
  }
  return crc;
}

// Create response packet
function createResponsePacket(command, data1, data2) {
  const packet = Buffer.alloc(71);
  packet.writeUInt16BE(0xF0F0, 0); // Start flag
  packet.writeUInt16BE(command, 2); // Command
  
  // Copy data
  if (data1) data1.copy(packet, 4, 0, Math.min(data1.length, 32));
  if (data2) data2.copy(packet, 36, 0, Math.min(data2.length, 32));
  
  packet.writeUInt16BE(0xF0F0, 68); // End flag
  packet[70] = calculateCRC(packet.slice(0, 70)); // CRC
  
  return packet;
}

// Track active simulators
const simulators = [];
const usedPorts = new Set();

// Box simulator class
class BoxSimulator {
  constructor(siteName, box) {
    this.siteName = siteName;
    this.box = box;
    this.ip = box.ip;
    this.pinStates = new Array(12).fill(0);
    this.connections = new Set();
    this.server = null;
    this.interval = null;
    this.isRunning = false;
    
    // Calculate port
    this.port = calculatePortFromIP(this.ip);
    
    // Make sure port is unique
    while (usedPorts.has(this.port)) {
      this.port++;
    }
    usedPorts.add(this.port);
  }
  
  start() {
    if (this.isRunning) return;
    
    try {
      // Create TCP server
      this.server = net.createServer(this.handleConnection.bind(this));
      
      // Start listening
      this.server.listen(this.port, '0.0.0.0', () => {
        log(`Box simulator for ${this.box.id} (${this.ip}) started on port ${this.port}`);
        this.isRunning = true;

        
        // Start interval to change pin states
        this.interval = setInterval(this.changeRandomPinStates.bind(this), STATE_CHANGE_INTERVAL);
      });
      console.log(`DEBUGGING: Box simulator listening on port ${this.port} for ${this.box.id}`);
      // Handle errors
      this.server.on('error', (err) => {
        log(`Server error for ${this.box.id}: ${err.message}`);
      });
      
      return true;
    } catch (error) {
      log(`Error starting simulator for ${this.box.id}: ${error.message}`);
      return false;
    }
  }
  
  stop() {
    if (!this.isRunning) return;
    
    try {
      // Clear interval
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      
      // Close connections
      for (const socket of this.connections) {
        socket.destroy();
      }
      this.connections.clear();
      
      // Close server
      if (this.server) {
        this.server.close();
        this.server = null;
      }
      
      this.isRunning = false;
      log(`Box simulator for ${this.box.id} (${this.ip}) stopped`);
      
      return true;
    } catch (error) {
      log(`Error stopping simulator for ${this.box.id}: ${error.message}`);
      return false;
    }
  }
  
  handleConnection(socket) {
    const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
    log(`New connection to ${this.box.id} from ${clientAddr}`);
    
    // Add to connections set
    this.connections.add(socket);
    
    // Handle data
    socket.on('data', (data) => {
      try {
        // Check for valid packet
        if (data.length >= 71 && 
            data.readUInt16BE(0) === 0xF0F0 && 
            data.readUInt16BE(68) === 0xF0F0) {
          
          // Get command
          const command = data.readUInt16BE(2);
          
          if (command === 0x0001) { // Read I/O state command
            log(`Received read command from ${clientAddr}`);
            
            // Create response
            const data1 = Buffer.alloc(32);
            const data2 = Buffer.alloc(32);
            
            // Fill with pin states
            for (let i = 0; i < this.pinStates.length; i++) {
              data1[i] = this.pinStates[i];
            }
            
            // Send response
            const response = createResponsePacket(0x0001, data1, data2);
            socket.write(response);
            
            log(`Sent I/O state response to ${clientAddr}`);
          }
        }
      } catch (error) {
        log(`Error processing data from ${clientAddr}: ${error.message}`);
      }
    });
    
    // Handle disconnect
    socket.on('close', () => {
      log(`Connection from ${clientAddr} closed`);
      this.connections.delete(socket);
    });
    
    // Handle errors
    socket.on('error', (err) => {
      log(`Error with connection from ${clientAddr}: ${err.message}`);
      this.connections.delete(socket);
    });
  }
  
  changeRandomPinStates() {
    try {
      // Get pins config
      const pins = this.box.pins || [];
      if (pins.length === 0) {
        log(`No pins configured for ${this.box.id}, skipping state change`);
        return;
      }
      
      // Choose 1-3 pins to change
      const pinsToChange = Math.floor(Math.random() * 3) + 1;
      log(`Changing ${pinsToChange} random pins for ${this.box.id}`);
      
      // Change pins
      for (let i = 0; i < pinsToChange; i++) {
        // Select random pin
        const randomIdx = Math.floor(Math.random() * pins.length);
        const pin = pins[randomIdx];
        
        if (!pin) continue;
        
        // Get pin number and index
        const pinNumber = pin.pin;
        if (!pinNumber || pinNumber < 1 || pinNumber > 12) continue;
        
        const pinIdx = pinNumber - 1; // 0-based index
        
        // Toggle state
        this.pinStates[pinIdx] = this.pinStates[pinIdx] === 1 ? 0 : 1;
        
        // Get alarm status
        const isAlarmCondition = pin.normallyOpen ? 
          (this.pinStates[pinIdx] === 1) : 
          (this.pinStates[pinIdx] === 0);
        
        const status = isAlarmCondition ? pin.severity : 'OK';
        
        log(`Pin ${pinNumber} (${pin.equipment}: ${pin.description}) changed to ${this.pinStates[pinIdx]} (${status})`);
      }
      
      // Broadcast change to all connected clients
      this.broadcastChange();
      
    } catch (error) {
      log(`Error changing pin states for ${this.box.id}: ${error.message}`);
    }
  }
  
  broadcastChange() {
    if (this.connections.size === 0) {
      log(`No clients connected to ${this.box.id}, skipping broadcast`);
      return;
    }
    
    try {
      // Create data buffers
      const data1 = Buffer.alloc(32);
      const data2 = Buffer.alloc(32);
      
      // Fill with current pin states
      for (let i = 0; i < this.pinStates.length; i++) {
        data1[i] = this.pinStates[i];
      }
      
      // Create auto-report packet
      const packet = createResponsePacket(0x0010, data1, data2);
      
      // Send to all clients
      for (const socket of this.connections) {
        socket.write(packet);
      }
      
      log(`Broadcasted state change to ${this.connections.size} clients for ${this.box.id}`);
    } catch (error) {
      log(`Error broadcasting state change: ${error.message}`);
    }
  }
}

// Start up all simulators
log('Starting box simulators...');

// Find all boxes in config
let boxCount = 0;
for (const siteName in boxConfig) {
  // Skip non-object properties
  if (typeof boxConfig[siteName] !== 'object' || 
      boxConfig[siteName] === null || 
      typeof boxConfig[siteName] === 'function') {
    continue;
  }
  
  const site = boxConfig[siteName];
  if (!site.boxes || !Array.isArray(site.boxes)) {
    continue;
  }
  
  // Start simulator for each box
  for (const box of site.boxes) {
    if (!box.ip) continue;
    
    // Create and start simulator
    const simulator = new BoxSimulator(siteName, box);
    if (simulator.start()) {
      simulators.push(simulator);
      boxCount++;
    }
  }
}

log(`Started ${boxCount} box simulators`);

// Handle process termination
process.on('SIGINT', () => {
  log('Shutting down simulators...');
  for (const simulator of simulators) {
    simulator.stop();
  }
  process.exit(0);
});

// Keep process running
process.stdin.resume();

// Export for testing
module.exports = {
  simulators,
  calculatePortFromIP
};