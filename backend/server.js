// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketService = require('./services/socketService');
const ModbusPoller = require('./services/modbusPoller');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/sites');
const alarmRoutes = require('./routes/alarms');
const notificationRoutes = require('./routes/notifications');
// Remove the userRoutes import that doesn't exist

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5000',
  credentials: true
}));
app.use(express.json());

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/notifications', notificationRoutes);
// Remove the users route that doesn't exist

// Initialize Socket.IO
const io = socketService.initSocketServer(server);

// Create Modbus poller instance
const modbusPoller = new ModbusPoller(io);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Initialize Modbus polling for all boxes
    const Site = require('./models/sites');
    const sites = await Site.find().lean();
    
    for (const site of sites) {
      if (site.boxes && site.boxes.length > 0) {
        for (const box of site.boxes) {
          await modbusPoller.startPolling(site, box);
        }
      }
    }
    
    // Start the server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Stop Modbus polling
  modbusPoller.stopAll();
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  // Stop Modbus polling
  modbusPoller.stopAll();
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});