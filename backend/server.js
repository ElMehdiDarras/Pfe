// backend/server.js or backend/app.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { initSocketServer } = require('./services/socketService');
const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/sites');
const alarmRoutes = require('./routes/alarms');
const notificationRoutes = require('./routes/notifications');
const { auth } = require('./middleware/auth');
require('dotenv').config();

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize socket server
const io = initSocketServer(server);

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', auth, siteRoutes);
app.use('/api/alarms', auth, alarmRoutes);
app.use('/api/notifications', auth, notificationRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
