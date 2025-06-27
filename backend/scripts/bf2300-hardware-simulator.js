// scripts/bf2300-simulator.js
/**
 * BF-2300 Box Hardware Simulator
 * 
 * This script simulates real BF-2300 hardware boxes:
 * - Creates TCP servers that respond to your system's polling
 * - Sends realistic pin state changes based on box configurations
 * - Monitors database to verify alarms are properly stored
 * - Operates independently like real hardware (no user auth required)
 */
const net = require('net');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
  // MongoDB connection string
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alarm-monitoring',
  
  // How long to run the simulation (in milliseconds)
  runDuration: 0, // 0 means run indefinitely until stopped with Ctrl+C
  
  // How often to generate random alarms (in milliseconds)
  alarmInterval: 10000, // 10 seconds
  
  // Probability of generating an alarm (0-1)
  alarmProbability: 0.7, // 70% chance
  
  // Probability of restoring a pin to normal state (0-1)
  restoreProbability: 0.3, // 30% chance
  
  // Log to file
  logToFile: true,
  logFile: './bf2300-simulation.log',
  
  // Port base for simulators
  portBase: 50000,
  
  // Show raw packet data
  showPacketData: false
};

// Global state
const activeBoxes = new Map(); // Map of active box simulators
const activeAlarms = new Map(); // Map of active alarms by boxId_pinId
let boxConfig = null;
let alarmSchema = null;
let Alarm = null;

// Initialize logging
function initLogging() {
  if (CONFIG.logToFile) {
    // Create or clear log file
    fs.writeFileSync(CONFIG.logFile, `=== BF-2300 Simulation Started at ${new Date().toISOString()} ===\n\n`);
  }
}

// Log message
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  if (CONFIG.logToFile) {
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  }
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    log('Connecting to MongoDB...');
    await mongoose.connect(CONFIG.mongoUri);
    log('Connected to MongoDB');
    
    // Define alarm schema for checking the database
    alarmSchema = new mongoose.Schema({
      siteId: String,
      boxId: String,
      pinId: String,
      equipment: String,
      description: String,
      status: String,
      timestamp: Date,
      acknowledgedBy: String,
      acknowledgedAt: Date,
      resolvedAt: Date,
      statusHistory: Array
    });
    
    Alarm = mongoose.model('Alarm', alarmSchema, 'alarms');
    
    return true;
  } catch (error) {
    log(`Failed to connect to MongoDB: ${error.message}`, 'error');
    return false;
  }
}

// Load box configuration
function loadBoxConfig() {
  try {
    log('Loading box configuration...');
    const configPath = path.join(__dirname, '../config/boxConfig.js');
    
    if (!fs.existsSync(configPath)) {
      log(`Box configuration file not found at ${configPath}`, 'error');
      return false;
    }
    
    boxConfig = require(configPath);
    
    if (!boxConfig || typeof boxConfig !== 'object') {
      log('Invalid box configuration format', 'error');
      return false;
    }
    
    // Count sites and boxes
    const sites = Object.entries(boxConfig).filter(([key, value]) => 
      typeof value === 'object' && !key.startsWith('_') && key !== 'getConfigForSite'
    );
    
    if (sites.length === 0) {
      log('No sites found in configuration', 'error');
      return false;
    }
    
    let totalBoxes = 0;
    sites.forEach(([siteName, siteConfig]) => {
      if (siteConfig.boxes && Array.isArray(siteConfig.boxes)) {
        totalBoxes += siteConfig.boxes.length;
      }
    });
    
    if (totalBoxes === 0) {
      log('No boxes found in configuration', 'error');
      return false;
    }
    
    log(`Loaded configuration for ${sites.length} sites with ${totalBoxes} boxes`);
    return true;
  } catch (error) {
    log(`Failed to load box configuration: ${error.message}`, 'error');
    return false;
  }
}

// Create BF-2300 packet
function createBF2300Packet(command, data1, data2) {
  // BF-2300 packet structure:
  // Start Flag (0xF0F0, 2 bytes) + Command (2 bytes) + Data1 (32 bytes) + Data2 (32 bytes) + End Flag (0xF0F0, 2 bytes) + CRC (1 byte)
  
  const packet = Buffer.alloc(71);
  
  // Set start flag (0xF0F0)
  packet.writeUInt16BE(0xF0F0, 0);
  
  // Set command
  packet.writeUInt16BE(command, 2);
  
  // Set Data1 (32 bytes)
  if (data1 && data1.length <= 32) {
    data1.copy(packet, 4);
  }
  
  // Set Data2 (32 bytes)
  if (data2 && data2.length <= 32) {
    data2.copy(packet, 36);
  }
  
  // Set end flag (0xF0F0)
  packet.writeUInt16BE(0xF0F0, 68);
  
  // Calculate and set CRC (simple sum of bytes)
  let crc = 0;
  for (let i = 0; i < 70; i++) {
    crc = (crc + packet[i]) & 0xFF;
  }
  packet[70] = crc;
  
  return packet;
}

// Create I/O state packet (0x0010 - auto report state)
function createIOStatePacket(inputStates, outputStates) {
  // Create Data1 buffer (32 bytes) for input states
  const data1 = Buffer.alloc(32);
  for (let i = 0; i < Math.min(inputStates.length, 32); i++) {
    data1[i] = inputStates[i] ? 1 : 0;
  }
  
  // Create Data2 buffer (32 bytes) for output states
  const data2 = Buffer.alloc(32);
  for (let i = 0; i < Math.min(outputStates.length, 32); i++) {
    data2[i] = outputStates[i] ? 1 : 0;
  }
  
  if (CONFIG.showPacketData) {
    log(`Input states: ${inputStates.map(s => s ? 1 : 0).join(',')}`);
    log(`Output states: ${outputStates.map(s => s ? 1 : 0).join(',')}`);
  }
  
  // Create packet with command 0x0010 (auto report)
  return createBF2300Packet(0x0010, data1, data2);
}

// Start a box simulator
function startBoxSimulator(siteName, boxConfig) {
  return new Promise((resolve, reject) => {
    try {
      const { id, ip, port = 50000 } = boxConfig;
      
      // Calculate port based on IP to avoid conflicts
      const lastOctet = parseInt(ip.split('.').pop());
      const secondLastOctet = parseInt(ip.split('.')[2]);
      const boxPort = CONFIG.portBase + ((secondLastOctet * 100 + lastOctet) % 10000);
      
      log(`Starting simulator for ${siteName} / ${id} (${ip}) on port ${boxPort}...`);
      
      // Initialize pin states (all normal)
      let pinStates = [];
      
      // Fill in pinStates based on configuration
      if (boxConfig.pins && Array.isArray(boxConfig.pins)) {
        // Initialize with 12 pins (maximum for BF-2300)
        pinStates = Array(12).fill(false);
        
        // For each configured pin, set the normal state based on normallyOpen
        boxConfig.pins.forEach(pin => {
          if (pin.pin > 0 && pin.pin <= 12) {
            // For normallyOpen: true, false = normal state
            // For normallyOpen: false, true = normal state
            const normallyOpen = pin.normallyOpen !== false;
            pinStates[pin.pin - 1] = !normallyOpen;
          }
        });
      } else {
        log(`No pins configured for box ${id}, using default normal states`);
        pinStates = Array(12).fill(false);
      }
      
      // Create server to handle connections
      const server = net.createServer((socket) => {
        log(`Connection established from ${socket.remoteAddress}:${socket.remotePort} to box ${id}`);
        
        // Handle data received from the system
        socket.on('data', (data) => {
          if (CONFIG.showPacketData) {
            log(`Received data from system for box ${id}: ${data.length} bytes`);
          }
          
          // Check for valid BF-2300 packet
          if (data.length >= 71 && 
              data.readUInt16BE(0) === 0xF0F0 && 
              data.readUInt16BE(68) === 0xF0F0) {
            
            // Extract command
            const command = data.readUInt16BE(2);
            
            // Handle command
            switch (command) {
              case 0x0001: // Read Digital I/O state
                log(`Received Read Digital I/O command for box ${id}`);
                
                // Create response with current pin states
                const response = createIOStatePacket(pinStates, Array(6).fill(false));
                
                // Send response
                socket.write(response);
                log(`Sent I/O state response for box ${id}`);
                break;
                
              default:
                log(`Received unknown command ${command.toString(16)} for box ${id}`);
                break;
            }
          } else {
            log(`Received invalid packet format for box ${id}`, 'warn');
          }
        });
        
        // Handle connection close
        socket.on('close', () => {
          log(`Connection closed for box ${id}`);
        });
        
        // Handle errors
        socket.on('error', (err) => {
          log(`Socket error for box ${id}: ${err.message}`, 'error');
        });
      });
      
      // Handle server errors
      server.on('error', (err) => {
        log(`Server error for box ${id}: ${err.message}`, 'error');
        reject(err);
      });
      
      // Start server
      server.listen(boxPort, '127.0.0.1', () => {
        log(`Box ${id} simulator listening on port ${boxPort}`);
        
        // Create box simulator object
        const boxSimulator = {
          server,
          siteName,
          boxConfig,
          pinStates,
          port: boxPort,
          updatePinState: async (pinNumber, state) => {
            try {
              // Check if pin exists
              if (pinNumber < 1 || pinNumber > pinStates.length) {
                log(`Invalid pin number ${pinNumber} for box ${id}`, 'error');
                return false;
              }
              
              // Update pin state
              pinStates[pinNumber - 1] = state;
              
              // Create key for tracking
              const alarmKey = `${id}_${pinNumber}`;
              
              // Send auto report
              await sendAutoReport(boxPort, pinStates);
              
              // Get pin configuration
              const pinConfig = boxConfig.pins ? boxConfig.pins.find(p => p.pin === pinNumber) : null;
              
              // Log the change
              if (pinConfig) {
                const normallyOpen = pinConfig.normallyOpen !== false;
                const isAlarmState = state === normallyOpen;
                
                if (isAlarmState) {
                  log(`🔴 ALARM: Set pin ${pinNumber} (${pinConfig.equipment}) to ALARM state on box ${id}`);
                  activeAlarms.set(alarmKey, {
                    siteName,
                    boxId: id,
                    pinId: pinNumber,
                    equipment: pinConfig.equipment,
                    description: pinConfig.description,
                    severity: pinConfig.severity,
                    timestamp: new Date()
                  });
                } else {
                  log(`🟢 NORMAL: Set pin ${pinNumber} (${pinConfig.equipment}) to NORMAL state on box ${id}`);
                  activeAlarms.delete(alarmKey);
                }
                
                // Verify in database after a delay
                setTimeout(() => verifyAlarmInDatabase(siteName, id, pinNumber, pinConfig, isAlarmState), 2000);
              } else {
                log(`Set pin ${pinNumber} to ${state ? 'HIGH' : 'LOW'} on box ${id}`);
              }
              
              return true;
            } catch (error) {
              log(`Error updating pin state: ${error.message}`, 'error');
              return false;
            }
          },
          randomAlarm: async () => {
            try {
              // Check if box has pins
              if (!boxConfig.pins || !boxConfig.pins.length) {
                log(`No pins configured for box ${id}, cannot generate random alarm`);
                return false;
              }
              
              // Get random pin
              const randomPinIndex = Math.floor(Math.random() * boxConfig.pins.length);
              const randomPin = boxConfig.pins[randomPinIndex];
              
              // Check if pin is already in alarm state
              const pinIndex = randomPin.pin - 1;
              const normallyOpen = randomPin.normallyOpen !== false;
              const currentlyInAlarm = pinStates[pinIndex] === normallyOpen;
              
              // Decide whether to set alarm or restore based on probabilities
              let setAlarm;
              if (currentlyInAlarm) {
                // Currently in alarm, chance to restore
                setAlarm = Math.random() >= CONFIG.restoreProbability;
              } else {
                // Currently normal, chance to alarm
                setAlarm = Math.random() < CONFIG.alarmProbability;
              }
              
              // Set state based on normallyOpen and desired alarm state
              const newState = setAlarm ? normallyOpen : !normallyOpen;
              
              // Update pin state (this will also send the packet)
              return await boxSimulator.updatePinState(randomPin.pin, newState);
            } catch (error) {
              log(`Error generating random alarm: ${error.message}`, 'error');
              return false;
            }
          }
        };
        
        // Store box simulator
        activeBoxes.set(id, boxSimulator);
        
        resolve(boxSimulator);
      });
      
    } catch (error) {
      log(`Error starting box simulator for ${id}: ${error.message}`, 'error');
      reject(error);
    }
  });
}

// Send auto report packet
async function sendAutoReport(port, pinStates) {
  return new Promise((resolve, reject) => {
    try {
      // Create auto report packet
      const packet = createIOStatePacket(pinStates, Array(6).fill(false));
      
      // Create client to send packet
      const client = new net.Socket();
      
      client.on('error', (err) => {
        client.destroy();
        reject(err);
      });
      
      client.connect(port, '127.0.0.1', () => {
        // Send packet
        client.write(packet);
        
        // Close after sending
        client.end(() => {
          resolve(true);
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Verify alarm in database
async function verifyAlarmInDatabase(siteName, boxId, pinNumber, pinConfig, isAlarmState) {
  try {
    if (!Alarm) {
      log('Alarm model not initialized, skipping database verification', 'warn');
      return;
    }
    
    // Give system time to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find alarm in database
    const query = {
      siteId: siteName,
      boxId: boxId,
      pinId: pinNumber.toString()
    };
    
    // Add resolved check if we're verifying a normal state
    if (!isAlarmState) {
      query.resolvedAt = { $ne: null };
    }
    
    const latestAlarm = await Alarm.findOne(query).sort({ timestamp: -1 });
    
    if (isAlarmState) {
      if (latestAlarm && latestAlarm.resolvedAt === null) {
        log(`✓ Verified alarm in database for ${siteName} / ${boxId} / Pin ${pinNumber} (${pinConfig.equipment})`);
      } else {
        log(`✗ Alarm not found in database for ${siteName} / ${boxId} / Pin ${pinNumber} (${pinConfig.equipment})`, 'warn');
      }
    } else {
      if (latestAlarm && latestAlarm.resolvedAt !== null) {
        log(`✓ Verified alarm resolution in database for ${siteName} / ${boxId} / Pin ${pinNumber} (${pinConfig.equipment})`);
      } else {
        log(`✗ Alarm resolution not found in database for ${siteName} / ${boxId} / Pin ${pinNumber} (${pinConfig.equipment})`, 'warn');
      }
    }
  } catch (error) {
    log(`Error verifying alarm in database: ${error.message}`, 'error');
  }
}

// Start all box simulators
async function startAllSimulators() {
  try {
    log('Starting all box simulators...');
    
    // Get sites
    const sites = Object.entries(boxConfig).filter(([key, value]) => 
      typeof value === 'object' && !key.startsWith('_') && key !== 'getConfigForSite'
    );
    
    // Start simulators for each box
    let startedCount = 0;
    for (const [siteName, siteConfig] of sites) {
      if (siteConfig.boxes && Array.isArray(siteConfig.boxes)) {
        for (const box of siteConfig.boxes) {
          try {
            await startBoxSimulator(siteName, box);
            startedCount++;
          } catch (error) {
            log(`Failed to start simulator for ${siteName} / ${box.id}: ${error.message}`, 'error');
          }
        }
      }
    }
    
    log(`Started ${startedCount} box simulators`);
    return startedCount > 0;
  } catch (error) {
    log(`Error starting simulators: ${error.message}`, 'error');
    return false;
  }
}

// Generate random alarms
async function generateRandomAlarms() {
  // Skip if no boxes
  if (activeBoxes.size === 0) {
    log('No active box simulators, skipping random alarm generation');
    return false;
  }
  
  try {
    // Select 1-3 random boxes
    const boxCount = Math.min(activeBoxes.size, Math.floor(Math.random() * 3) + 1);
    const boxIds = Array.from(activeBoxes.keys());
    const selectedBoxes = [];
    
    for (let i = 0; i < boxCount; i++) {
      const randomIndex = Math.floor(Math.random() * boxIds.length);
      selectedBoxes.push(boxIds[randomIndex]);
      boxIds.splice(randomIndex, 1);
      
      if (boxIds.length === 0) break;
    }
    
    log(`Generating random alarms for ${boxCount} boxes...`);
    
    // Generate alarms for selected boxes
    let successCount = 0;
    for (const boxId of selectedBoxes) {
      const box = activeBoxes.get(boxId);
      if (box) {
        const success = await box.randomAlarm();
        if (success) successCount++;
      }
    }
    
    log(`Generated ${successCount} random alarms`);
    return successCount > 0;
  } catch (error) {
    log(`Error generating random alarms: ${error.message}`, 'error');
    return false;
  }
}

// Show active alarm status
function showActiveAlarms() {
  if (activeAlarms.size === 0) {
    log('No active alarms');
    return;
  }
  
  log(`\n=== ${activeAlarms.size} Active Alarms ===`);
  
  for (const [key, alarm] of activeAlarms.entries()) {
    const timeAgo = Math.round((new Date() - alarm.timestamp) / 1000);
    log(`${alarm.siteName} / ${alarm.boxId} / Pin ${alarm.pinId} (${alarm.equipment}) - ${alarm.severity} - ${timeAgo}s ago`);
  }
  
  log('');
}

// Main function
async function main() {
  // Initialize
  initLogging();
  log('Starting BF-2300 hardware simulator...');
  
  // Connect to database
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    log('Cannot verify alarms without database connection', 'warn');
  }
  
  // Load box configuration
  const configLoaded = loadBoxConfig();
  if (!configLoaded) {
    log('Cannot continue without box configuration', 'error');
    process.exit(1);
  }
  
  // Start simulators
  const simulatorsStarted = await startAllSimulators();
  if (!simulatorsStarted) {
    log('Failed to start any simulators', 'error');
    process.exit(1);
  }
  
  // Start generating random alarms if interval set
  if (CONFIG.alarmInterval > 0) {
    log(`Will generate random alarms every ${CONFIG.alarmInterval / 1000} seconds`);
    
    const alarmIntervalId = setInterval(async () => {
      await generateRandomAlarms();
      showActiveAlarms();
    }, CONFIG.alarmInterval);
    
    // Set timeout if duration specified
    if (CONFIG.runDuration > 0) {
      setTimeout(() => {
        clearInterval(alarmIntervalId);
        shutdown();
      }, CONFIG.runDuration);
      
      log(`Simulation will run for ${CONFIG.runDuration / 1000} seconds`);
    } else {
      log('Simulation will run until stopped with Ctrl+C');
    }
  } else {
    log('No alarm generation interval set, simulator will run passively');
  }
}

// Shutdown function
async function shutdown() {
  log('Shutting down simulators...');
  
  // Close all servers
  for (const [boxId, box] of activeBoxes.entries()) {
    try {
      box.server.close();
      log(`Stopped simulator for ${box.boxConfig.id}`);
    } catch (error) {
      log(`Error stopping simulator for ${box.boxConfig.id}: ${error.message}`, 'error');
    }
  }
  
  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    log('Closed database connection');
  }
  
  log(`Simulation ended at ${new Date().toISOString()}`);
  process.exit(0);
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  log('Received SIGINT signal');
  await shutdown();
});

// Run main function
if (require.main === module) {
  main().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}