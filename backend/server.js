// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const alarmsRoutes = require('./routes/alarms');
const sitesRoutes = require('./routes/sites');

// Initialize Express app
const app = express();

// Apply middleware first
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with enhanced CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Debug route to test API responses
app.get('/api/debug', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    success: true, 
    message: 'API is working', 
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      mongoUri: MONGODB_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://****:****@'),
      port: process.env.PORT || 5000
    }
  });
});

// Routes
app.use('/api/alarms', alarmsRoutes);
app.use('/api/sites', sitesRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Emit a test event to verify connection
  socket.emit('connection-established', { 
    message: 'Successfully connected to server',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  // Handle client errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io accessible to our routes
app.set('io', io);

// ====== GRPC SERVER SETUP ======

// Load proto file
const packageDefinition = protoLoader.loadSync(path.join(__dirname, 'alarm.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const alarmProto = grpc.loadPackageDefinition(packageDefinition).alarm;

// Import the Alarm model
const Alarm = require('./models/alarm');
const Site = require('./models/sites');

// Implement the gRPC service
const grpcServer = new grpc.Server();
grpcServer.addService(alarmProto.AlarmService.service, {
  // Handle streaming alarms from boxes
  streamAlarms: (call, callback) => {
    console.log('New box connected and streaming alarms');
    
    call.on('data', async (alarmUpdate) => {
      console.log(`Received update from box ${alarmUpdate.box_id} at site ${alarmUpdate.site_id}`);
      
      // Process each pin alarm
      for (const pin of alarmUpdate.pins) {
        // Convert status to string if it's a number
        const statusName = typeof pin.status === 'number' ? getAlarmStatusName(pin.status) : pin.status;
        
        try {
          // Create a new alarm document or update existing one
          const alarmData = {
            siteId: alarmUpdate.site_id,
            boxId: alarmUpdate.box_id,
            pinId: pin.pin_id.toString(),
            equipment: pin.equipment || 'Unknown',
            description: pin.description,
            status: statusName,
            timestamp: new Date(alarmUpdate.timestamp)
          };
          
          // Find if there's an existing alarm with the same site, box, and pin ID
          const existingAlarm = await Alarm.findOne({
            siteId: alarmUpdate.site_id,
            boxId: alarmUpdate.box_id,
            pinId: pin.pin_id.toString(),
            status: { $ne: 'OK' }, // Only look for unresolved alarms
            acknowledgedAt: null // Only consider unacknowledged alarms
          });
          
          if (existingAlarm && statusName === 'OK') {
            // If the status is now OK, resolve the existing alarm
            existingAlarm.resolvedAt = new Date();
            existingAlarm.status = 'OK';
            await existingAlarm.save();
            console.log(`Resolved alarm: ${existingAlarm._id}`);
          } else if (!existingAlarm && statusName !== 'OK') {
            // Create a new alarm if one doesn't exist and status is not OK
            const newAlarm = await new Alarm(alarmData).save();
            console.log(`Created new alarm: ${newAlarm._id}`);
          } else if (existingAlarm && statusName !== 'OK') {
            // Update existing alarm if status changed
            if (existingAlarm.status !== statusName) {
              existingAlarm.status = statusName;
              existingAlarm.timestamp = new Date(alarmUpdate.timestamp);
              await existingAlarm.save();
              console.log(`Updated alarm: ${existingAlarm._id}`);
            }
          }
          
          // Update site status based on active alarms
          try {
            const site = await Site.findOne({ name: alarmUpdate.site_id });
            if (site) {
              // Count active alarms for this site
              const activeAlarms = await Alarm.find({
                siteId: alarmUpdate.site_id,
                status: { $ne: 'OK' },
                resolvedAt: null
              });
              
              let worstStatus = 'OK';
              
              // Determine worst status
              for (const alarm of activeAlarms) {
                if (alarm.status === 'CRITICAL') {
                  worstStatus = 'CRITICAL';
                  break;
                } else if (alarm.status === 'MAJOR' && worstStatus !== 'CRITICAL') {
                  worstStatus = 'MAJOR';
                } else if (alarm.status === 'WARNING' && worstStatus !== 'CRITICAL' && worstStatus !== 'MAJOR') {
                  worstStatus = 'WARNING';
                }
              }
              
              site.status = worstStatus;
              site.activeAlarms = activeAlarms.length;
              await site.save();
              console.log(`Updated site status: ${site.name} - ${site.status}`);
            }
          } catch (siteError) {
            console.error('Error updating site status:', siteError);
          }
          
          // Emit real-time update via Socket.IO
          io.emit('alarm-status-change', {
            siteId: alarmUpdate.site_id,
            boxId: alarmUpdate.box_id,
            pinId: pin.pin_id.toString(),
            equipment: pin.equipment || 'Unknown',
            description: pin.description,
            status: statusName,
            timestamp: new Date(alarmUpdate.timestamp)
          });
        } catch (error) {
          console.error('Error saving alarm to MongoDB:', error);
        }
      }
    });
    
    call.on('end', () => {
      console.log('Box stream ended');
      callback(null, { success: true, message: 'Stream received successfully' });
    });
    
    call.on('error', (error) => {
      console.error('Error in box stream:', error);
    });
  }
});

// Helper function to convert numeric status to string
function getAlarmStatusName(statusCode) {
  const statusMap = {
    0: 'OK',
    1: 'WARNING',
    2: 'MAJOR',
    3: 'CRITICAL',
    4: 'UNKNOWN'
  };
  return statusMap[statusCode] || 'UNKNOWN';
}

// Helper function to convert numeric level to string
function getAlarmLevelName(levelCode) {
  const levelMap = {
    0: 'INFORMATION',
    1: 'WARNING',
    2: 'MAJOR',
    3: 'CRITICAL'
  };
  return levelMap[levelCode] || 'CRITICAL';
}

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.url} not found` });
});

// Start the gRPC server
function startGrpcServer() {
  const grpcPort = process.env.GRPC_PORT || 50051;
  console.log(`Attempting to start gRPC server on port ${grpcPort}...`);
  
  grpcServer.bindAsync(`0.0.0.0:${grpcPort}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error('Failed to bind gRPC server:', err);
      return;
    }
    console.log(`gRPC server bound successfully to port ${boundPort}`);
    grpcServer.start();
    console.log('gRPC server started successfully');
  });
}

// Start Express and gRPC servers
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Debug endpoint: http://localhost:${PORT}/api/debug`);
  // Start gRPC server after HTTP server is running
  startGrpcServer();
});

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Received shutdown signal');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close MongoDB connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // If server doesn't close in 5 seconds, force exit
  setTimeout(() => {
    console.error('Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 5000);
}