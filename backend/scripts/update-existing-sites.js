// update-existing-sites.js
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Site = require('../models/sites');
const Alarm = require('../models/alarm');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';

// Equipment data for existing sites
const existingSitesEquipment = {
  'Rabat-Hay-NAHDA': [
    {
      name: 'Armoire DC-48 SDM NOKIA',
      type: 'Armoire Électrique',
      status: 'CRITICAL',
      pinId: 'PIN_01'
    },
    {
      name: 'ONE-NDS PDU 1',
      type: 'Armoire Électrique',
      status: 'CRITICAL',
      pinId: 'PIN_02'
    },
    {
      name: 'Climatiseur 1',
      type: 'Climatisation',
      status: 'MAJOR',
      pinId: 'PIN_05'
    },
    {
      name: 'Climatiseur 2',
      type: 'Climatisation',
      status: 'OK',
      pinId: 'PIN_06'
    },
    {
      name: 'THERMOSTAT D\'AMBIANCE',
      type: 'Thermostat',
      status: 'WARNING',
      pinId: 'PIN_07'
    }
  ],
  'Casa-Nations-Unies': [
    {
      name: 'Armoire DC-48 SDM NOKIA',
      type: 'Armoire Électrique',
      status: 'OK',
      pinId: 'PIN_01'
    },
    {
      name: 'ONE-NDS PDU 1',
      type: 'Armoire Électrique',
      status: 'OK',
      pinId: 'PIN_02'
    },
    {
      name: 'Climatiseur 1',
      type: 'Climatisation',
      status: 'OK',
      pinId: 'PIN_05'
    },
    {
      name: 'Climatiseur 2',
      type: 'Climatisation',
      status: 'OK',
      pinId: 'PIN_06'
    },
    {
      name: 'THERMOSTAT D\'AMBIANCE',
      type: 'Thermostat',
      status: 'OK',
      pinId: 'PIN_07'
    }
  ]
};

// Generate alarms for equipment
const generateAlarmsForExistingSites = (sites) => {
  const alarms = [];
  const now = new Date();
  
  sites.forEach(site => {
    const siteEquipment = site.equipment || [];
    
    siteEquipment.forEach(equip => {
      // Skip alarms for OK equipment
      if (equip.status === 'OK') return;
      
      // Current active alarm
      alarms.push({
        siteId: site.name,
        boxId: site.boxes[0].name,
        pinId: equip.pinId,
        equipment: equip.name,
        description: `Défaut ${equip.type} - ${equip.name}`,
        status: equip.status,
        timestamp: now,
      });
      
      // Add some historical alarms
      for (let i = 1; i <= 3; i++) {
        const historyDate = new Date(now);
        historyDate.setHours(now.getHours() - (i * 8)); // Spread out every 8 hours
        
        alarms.push({
          siteId: site.name,
          boxId: site.boxes[0].name,
          pinId: equip.pinId,
          equipment: equip.name,
          description: `Défaut ${equip.type} - ${equip.name}`,
          status: Math.random() > 0.5 ? equip.status : 'OK', // Mix of OK and problem states
          timestamp: historyDate,
          acknowledgedBy: Math.random() > 0.7 ? 'supervisor' : null, // Some alarms acknowledged
          acknowledgedAt: Math.random() > 0.7 ? historyDate : null,
          resolvedAt: Math.random() > 0.5 ? new Date(historyDate.getTime() + 60*60*1000) : null // Some resolved an hour later
        });
      }
    });
  });
  
  return alarms;
};

// Function to update existing sites
async function updateExistingSites() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Sites to update
    const sitesToUpdate = ['Rabat-Hay-NAHDA', 'Casa-Nations-Unies'];
    const updatedSites = [];
    
    for (const siteName of sitesToUpdate) {
      // Find the site
      const site = await Site.findOne({ name: siteName });
      if (!site) {
        console.log(`Site ${siteName} not found, skipping...`);
        continue;
      }
      
      // Skip if site already has equipment
      if (site.equipment && site.equipment.length > 0) {
        console.log(`Site ${siteName} already has ${site.equipment.length} equipment items, skipping...`);
        continue;
      }
      
      // Add equipment to the site
      const equipmentList = existingSitesEquipment[siteName] || [];
      equipmentList.forEach(equipData => {
        // Add box reference (first box)
        equipData.boxId = site.boxes[0]._id;
        site.equipment.push(equipData);
      });
      
      // Update activeAlarms count
      site.activeAlarms = equipmentList.filter(e => e.status !== 'OK').length;
      
      // Update site status based on equipment status
      const criticalCount = equipmentList.filter(e => e.status === 'CRITICAL').length;
      const majorCount = equipmentList.filter(e => e.status === 'MAJOR').length;
      const warningCount = equipmentList.filter(e => e.status === 'WARNING').length;
      
      if (criticalCount > 0) {
        site.status = 'CRITICAL';
      } else if (majorCount > 0) {
        site.status = 'MAJOR';
      } else if (warningCount > 0) {
        site.status = 'WARNING';
      } else {
        site.status = 'OK';
      }
      
      await site.save();
      updatedSites.push(site);
      console.log(`Updated site: ${site.name} with ${site.equipment.length} equipment items`);
    }
    
    // Generate and create alarms for updated sites
    if (updatedSites.length > 0) {
      const alarms = generateAlarmsForExistingSites(updatedSites);
      
      if (alarms.length > 0) {
        // Remove any existing alarms for these sites to avoid duplicates
        await Alarm.deleteMany({ 
          siteId: { $in: updatedSites.map(site => site.name) } 
        });
        
        // Insert new alarms
        await Alarm.insertMany(alarms);
        console.log(`Created ${alarms.length} alarms for existing sites`);
      }
    }
    
    console.log('Site updates completed successfully!');
  } catch (error) {
    console.error('Error updating existing sites:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
updateExistingSites();