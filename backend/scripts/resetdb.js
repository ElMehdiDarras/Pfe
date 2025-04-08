// scripts/resetDatabase.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import your models
const User = require('../models/users');
const Site = require('../models/sites');
const Alarm = require('../models/alarm');
const Notification = require('../models/notifications');
const PinConfiguration = require('../models/pinConfiguration');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Keep admin users or create a default one if none exists
      const adminExists = await User.findOne({ role: 'administrator' });
      
      // Empty collections
      await Site.deleteMany({});
      await Alarm.deleteMany({});
      await Notification.deleteMany({});
      await PinConfiguration.deleteMany({});
      
      // Only delete non-admin users if an admin exists
      if (adminExists) {
        await User.deleteMany({ role: { $ne: 'administrator' } });
      } else {
        await User.deleteMany({});
        // Create default admin
        const defaultAdmin = new User({
          username: 'admin',
          password: 'admin123', // Will be hashed by the pre-save hook
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@example.com',
          role: 'administrator',
          active: true
        });
        await defaultAdmin.save();
        console.log('Created default admin user');
      }
      
      console.log('Database reset complete');
    } catch (error) {
      console.error('Error resetting database:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });