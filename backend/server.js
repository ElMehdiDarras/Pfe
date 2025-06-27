// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketService = require('./services/socketService');
const { initDataPurgeJob } = require('./jobs/datapurge');
const bf2300Service = require('./services/bf2300Service');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const siteRoutes = require('./routes/sites');
const alarmRoutes = require('./routes/alarms');
const notificationRoutes = require('./routes/notifications');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = process.env.FRONTEND_URL.split(',');
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/notifications', notificationRoutes);

// Initialize Socket.IO
const io = socketService.initSocketServer(server);
app.set('io', io); // Make io available to routes

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Initialize BF-2300 monitoring for all boxes
    try {
      const bf2300Instance = bf2300Service(io);
      await bf2300Instance.initialize();
      console.log('BF-2300 service initialized');
      
      // Check for boxes already in database
      const Site = require('./models/sites');
      const sites = await Site.find().lean();
      
      console.log(`Found ${sites.length} sites with a total of ${sites.reduce((sum, site) => sum + (site.boxes?.length || 0), 0)} boxes`);
      
      // Start monitoring all configured boxes
      for (const site of sites) {
        if (site.boxes && site.boxes.length > 0) {
          for (const box of site.boxes) {
            try {
              await bf2300Instance.monitorBox(site.name, box);
              console.log(`Started monitoring box ${box.name} (${box.ip}) for site ${site.name}`);
            } catch (boxErr) {
              console.error(`Failed to start monitoring for box ${box.name} (${box.ip}):`, boxErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error initializing BF-2300 service:', err);
    }
    
    // Start the server
    const PORT = process.env.PORT || 2001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
  initDataPurgeJob();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'up', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Stop BF-2300 monitoring
  await bf2300Service.shutdown();
  console.log('BF-2300 service stopped');
  
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
  
  // Stop BF-2300 monitoring
  await bf2300Instance.shutdown();
  console.log('BF-2300 service stopped');
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Export app for testing
module.exports = app;