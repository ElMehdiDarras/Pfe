// test-pin-simulation.js
require('dotenv').config();
const mongoose = require('mongoose');
const { processPinStateChange } = require('./services/socketService');

// Mock IO object for testing
const mockIo = {
  to: () => ({
    to: () => ({
      emit: (event, data) => {
        console.log(`Emitting ${event}:`, data);
      }
    }),
    emit: (event, data) => {
      console.log(`Emitting ${event}:`, data);
    }
  }),
  emit: (event, data) => {
    console.log(`Emitting ${event}:`, data);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create pin configuration if it doesn't exist
    const PinConfiguration = require('./models/pinConfiguration');
    
    const sites = [
      { name: 'Meknès Hamria III', box: 'Box Alarme-1', pin: 6 },
      { name: 'Fès AL ADARISSA', box: 'Box Alarme-1', pin: 8 }
    ];
    
    // Create pin configurations if they don't exist
    for (const site of sites) {
      const existingConfig = await PinConfiguration.findOne({
        siteId: site.name,
        boxId: site.box,
        pinNumber: site.pin
      });
      
      if (!existingConfig) {
        await PinConfiguration.create({
          siteId: site.name,
          boxId: site.box,
          pinNumber: site.pin,
          equipmentName: 'Climatiseur de précision 1',
          description: 'Défaut Climatiseur - Test Simulation',
          alarmSeverity: 'CRITICAL',
          normallyOpen: true
        });
        
        console.log(`Created pin configuration for ${site.name}, box: ${site.box}, pin: ${site.pin}`);
      }
    }
    
    // Simulate alarm activation
    console.log('Simulating alarm activation...');
    
    for (const site of sites) {
      await processPinStateChange(site.name, site.box, site.pin, 1, mockIo);
      console.log(`Activated alarm for ${site.name}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Wait before resolving
    console.log('Waiting 20 seconds before resolving...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Simulate alarm resolution
    console.log('Simulating alarm resolution...');
    
    for (const site of sites) {
      await processPinStateChange(site.name, site.box, site.pin, 0, mockIo);
      console.log(`Resolved alarm for ${site.name}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('Simulation complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });