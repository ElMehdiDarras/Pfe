// services/modbusPoller.js
const ModbusRTU = require('modbus-serial');
const { processPinStateChange } = require('./socketService');

class ModbusPoller {
  constructor(io) {
    this.pollers = new Map();
    this.io = io;
    this.lastStates = new Map(); // Track last seen states
  }
  
  async startPolling(site, box) {
    const key = `${site.name}-${box.name}`;
    
    if (this.pollers.has(key)) {
      // Already polling this box
      return;
    }
    
    // Create poller
    const poll = async () => {
      try {
        const client = new ModbusRTU();
        
        try {
          // Connect to the Modbus device
          await client.connectTCP(box.ip, { port: box.port || 502 });
          client.setID(1);
          
          // Read 16 discrete inputs (adjust as needed for your hardware)
          const result = await client.readDiscreteInputs(0, 16);
          
          if (result && result.data) {
            // Process each input
            for (let i = 0; i < result.data.length; i++) {
              const pinNumber = i + 1; // Convert zero-based index to pin number
              const newState = result.data[i] ? 1 : 0;
              
              // Create unique key for this pin
              const pinKey = `${key}-${pinNumber}`;
              
              // Check if state changed
              if (!this.lastStates.has(pinKey) || this.lastStates.get(pinKey) !== newState) {
                console.log(`Pin state change: ${site.name}, ${box.name}, pin ${pinNumber}: ${newState}`);
                
                // Update stored state
                this.lastStates.set(pinKey, newState);
                
                // Process the state change
                await processPinStateChange(site.name, box.name, pinNumber, newState, this.io);
              }
            }
            
            // Update box status
            await require('../models/sites').updateOne(
              { name: site.name, "boxes.name": box.name },
              { 
                $set: { 
                  "boxes.$.status": "UP",
                  "boxes.$.lastSeen": new Date()
                }
              }
            );
          }
        } catch (error) {
          console.error(`Modbus polling error for ${box.ip}:`, error);
          
          // Mark box as offline
          await require('../models/sites').updateOne(
            { name: site.name, "boxes.name": box.name },
            { $set: { "boxes.$.status": "DOWN" } }
          );
        } finally {
          client.close();
        }
      } catch (e) {
        console.error(`Error in polling cycle for ${key}:`, e);
      }
    };
    
    // Start polling interval
    console.log(`Starting polling for ${key} (${box.ip}:${box.port || 502})`);
    const intervalId = setInterval(poll, 5000); // Poll every 5 seconds
    this.pollers.set(key, intervalId);
    
    // Run initial poll
    poll();
  }
  
  stopPolling(site, box) {
    const key = `${site.name}-${box.name}`;
    
    if (this.pollers.has(key)) {
      clearInterval(this.pollers.get(key));
      this.pollers.delete(key);
      console.log(`Stopped polling for ${key}`);
    }
  }
  
  stopAll() {
    for (const [key, intervalId] of this.pollers.entries()) {
      clearInterval(intervalId);
      console.log(`Stopped polling for ${key}`);
    }
    this.pollers.clear();
  }
}

module.exports = ModbusPoller;