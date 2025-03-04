const ModbusRTU = require('modbus-serial');
const AlarmModel = require('../models/alarm');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

class ModbusMonitor {
  constructor(io) {
    this.io = io;
    this.clients = {};
    this.isRunning = false;
    this.grpcClients = {}; // Store gRPC clients for each site
  }

  // Initialize connection to a box controller
  async connectToBox(boxConfig) {
    const { id, ipAddress, port, siteId } = boxConfig;
    try {
      const client = new ModbusRTU();
      await client.connectTCP(ipAddress, { port: port || 502 });
      client.setID(1);
      this.clients[id] = {
        client,
        config: boxConfig,
        connected: true,
        lastUpdate: new Date()
      };
      console.log(`Connected to box ${id} at ${ipAddress}:${port}`);
      
      // Set up gRPC client for this site if not already created
      this.ensureGrpcClientForSite(siteId);
      
      return true;
    } catch (error) {
      console.error(`Failed to connect to box ${id} at ${ipAddress}:${port}:`, error.message);
      this.clients[id] = {
        config: boxConfig,
        connected: false,
        lastError: error.message,
        lastUpdate: new Date()
      };
      return false;
    }
  }

  // Ensure we have a gRPC client for the site
  ensureGrpcClientForSite(siteId) {
    if (!this.grpcClients[siteId]) {
      // Load proto file
      const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../alarm.proto'), {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      const alarmProto = grpc.loadPackageDefinition(packageDefinition).alarm;

      // Create gRPC client
      const client = new alarmProto.AlarmService(
        process.env.GRPC_SERVER || 'localhost:50051',
        grpc.credentials.createInsecure()
      );

      // Set up streaming call
      const call = client.streamAlarms((error, response) => {
        if (error) {
          console.error(`Error in gRPC stream for site ${siteId}:`, error);
          return;
        }
        console.log(`gRPC stream ended for site ${siteId}:`, response);
      });

      this.grpcClients[siteId] = { client, call };
      console.log(`gRPC client created for site ${siteId}`);
    }
  }

  // Start monitoring all pins
  async startMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.monitoringInterval = setInterval(() => {
      this.checkAllBoxes();
    }, 5000); // Check every 5 seconds
  }

  // Check all boxes and their pins
  async checkAllBoxes() {
    for (const boxId in this.clients) {
      const box = this.clients[boxId];
      if (!box.connected) {
        // Try to reconnect
        await this.connectToBox(box.config);
        continue;
      }
      
      try {
        // Read digital inputs (adjust register based on your hardware)
        const data = await box.client.readInputRegisters(0, box.config.pins.length);
        
        // Group all pins for this box into a single gRPC update
        const alarmUpdate = {
          box_id: boxId,
          site_id: box.config.siteId,
          timestamp: new Date().toISOString(),
          pins: []
        };
        
        // Process each pin status
        box.config.pins.forEach((pin, index) => {
          const pinStatus = data.data[index] === 1;
          const status = pinStatus ? this.mapLevelToStatus(pin.alarmLevel) : 0; // 0 = OK
          
          // Add to gRPC update
          alarmUpdate.pins.push({
            pin_id: pin.id,
            equipment: pin.equipment || 'Unknown Equipment',
            description: pin.description,
            status: status,
            level: this.mapAlarmLevelToGrpc(pin.alarmLevel)
          });
          
          // Check if status changed
          if (pin.lastStatus !== pinStatus) {
            const alarmStatus = pinStatus ? pin.alarmLevel : 'OK';
            // Save to database
            new AlarmModel({
              siteId: box.config.siteId,
              boxId: boxId,
              pinId: pin.id,
              description: pin.description,
              status: alarmStatus,
              timestamp: new Date()
            }).save();
            
            // Emit event via Socket.IO
            this.io.emit('alarm-status-change', {
              siteId: box.config.siteId,
              boxId: boxId,
              pinId: pin.id,
              description: pin.description,
              status: alarmStatus,
              timestamp: new Date()
            });
            
            // Update last status
            pin.lastStatus = pinStatus;
          }
        });
        
        // Send update via gRPC
        if (this.grpcClients[box.config.siteId]) {
          this.grpcClients[box.config.siteId].call.write(alarmUpdate);
        }
        
        box.lastUpdate = new Date();
      } catch (error) {
        console.error(`Error reading from box ${boxId}:`, error.message);
        box.connected = false;
        box.lastError = error.message;
        box.lastUpdate = new Date();
        // Emit box disconnection event
        this.io.emit('box-status-change', {
          boxId: boxId,
          connected: false,
          error: error.message,
          timestamp: new Date()
        });
      }
    }
  }

  // Map alarm level string to gRPC enum value
  mapAlarmLevelToGrpc(level) {
    const levelMap = {
      'INFORMATION': 0,
      'WARNING': 1,
      'MAJOR': 2,
      'CRITICAL': 3
    };
    return levelMap[level] || 3; // Default to CRITICAL if unknown
  }
  
  // Map alarm level to status code
  mapLevelToStatus(level) {
    const statusMap = {
      'OK': 0,
      'WARNING': 1,
      'MAJOR': 2,
      'CRITICAL': 3,
      'UNKNOWN': 4
    };
    return statusMap[level] || 4; // Default to UNKNOWN if not found
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isRunning) return;
    clearInterval(this.monitoringInterval);
    this.isRunning = false;
    
    // Close all connections
    for (const boxId in this.clients) {
      if (this.clients[boxId].connected && this.clients[boxId].client) {
        this.clients[boxId].client.close();
      }
    }
    
    // Close all gRPC streams
    for (const siteId in this.grpcClients) {
      this.grpcClients[siteId].call.end();
    }
  }
}

module.exports = ModbusMonitor;