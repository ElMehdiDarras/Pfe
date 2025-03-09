// scripts/populatedatabase.js
require('dotenv').config();
const mongoose = require('mongoose');
const Alarm = require('../models/alarm');
const Site = require('../models/sites');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to generate random date in the past X days
const getRandomDate = (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
};

// Function to generate random alarm status
const getRandomStatus = () => {
  const statuses = ['OK', 'WARNING', 'MAJOR', 'CRITICAL'];
  const weights = [0.65, 0.2, 0.1, 0.05]; // 65% OK, 20% WARNING, 10% MAJOR, 5% CRITICAL
  
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return statuses[i];
  }
  return statuses[0];
};

// Seed the database with alarms for existing sites
const seedDatabase = async () => {
  try {
    console.log('Clearing existing alarms...');
    await Alarm.deleteMany({});

    // Fetch existing sites
    console.log('Fetching existing sites...');
    const sites = await Site.find();
    
    if (sites.length === 0) {
      console.error('No sites found in the database. Please create sites first.');
      process.exit(1);
    }
    
    console.log(`Found ${sites.length} sites in the database.`);
    
    // Equipment types for each site based on its existing equipment
    const siteEquipmentMap = {};
    
    // Create a map of site names to their equipment for reference
    sites.forEach(site => {
      const equipmentTypes = site.equipment.map(equip => ({
        name: equip.name,
        type: equip.type,
        boxId: equip.boxId,
        pinId: equip.pinId,
      }));
      
      siteEquipmentMap[site.name] = equipmentTypes;
    });

    // Common alarm descriptions
    const alarmDescriptions = {
      'Armoire Électrique': [
        'Défaut Alimentation DC Normal',
        'Défaut Alimentation DC Secours',
        'Défaut Redresseur source 1',
        'Défaut Redresseur source 2'
      ],
      'Climatisation': [
        'Défaut Climatiseur',
        'Alarme Dérangement Climatiseur',
        'Température Élevée'
      ],
      'Thermostat': [
        'Température Maximum dépassé',
        'Défaut Température ambiante',
        'Alerte température élevée'
      ]
    };

    // Generate alarms
    console.log('Generating alarms...');
    
    const alarms = [];
    // Create 15-20 alarms per site for a realistic dataset
    sites.forEach(site => {
      const siteEquipment = siteEquipmentMap[site.name] || [];
      
      // Skip if site has no equipment
      if (siteEquipment.length === 0) {
        console.log(`Skipping site ${site.name} - no equipment found`);
        return;
      }
      
      const numAlarms = 15 + Math.floor(Math.random() * 6); // 15-20 alarms per site
      
      for (let i = 0; i < numAlarms; i++) {
        // Pick a random equipment from this site
        const equipment = siteEquipment[Math.floor(Math.random() * siteEquipment.length)];
        const equipType = equipment.type;
        
        // Get appropriate descriptions for this equipment type
        const descriptions = alarmDescriptions[equipType] || ['Défaut général'];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        const status = getRandomStatus();
        const timestamp = getRandomDate();
        
        // Get box info
        const boxId = `Box Alarme-${Math.floor(Math.random() * 2) + 1}`;
        
        // Create status history
        const statusHistory = [
          {
            status,
            timestamp
          }
        ];
        
        // Add a previous status if not OK (to simulate history)
        if (status !== 'OK') {
          const prevStatus = status === 'CRITICAL' ? 'MAJOR' : 
                           status === 'MAJOR' ? 'WARNING' : 'OK';
          
          const prevTimestamp = new Date(timestamp);
          prevTimestamp.setHours(prevTimestamp.getHours() - 2);
          
          statusHistory.unshift({
            status: prevStatus,
            timestamp: prevTimestamp
          });
        }
        
        // Random user who acknowledged the alarm (if status is not critical)
        const acknowledgedByUsers = ['admin', 'supervisor', 'super_north', null, null, null]; // 50% chance of being null
        
        const alarm = new Alarm({
          siteId: site.name,
          boxId,
          pinId: equipment.pinId,
          equipment: equipment.name,
          description: `${equipment.name} ${description}`,
          status,
          timestamp,
          acknowledgedBy: status !== 'CRITICAL' && Math.random() > 0.5 ? 
                        acknowledgedByUsers[Math.floor(Math.random() * acknowledgedByUsers.length)] : 
                        null,
          acknowledgedAt: status !== 'CRITICAL' && Math.random() > 0.5 ? new Date() : null,
          resolvedAt: status === 'OK' ? new Date() : null,
          statusHistory
        });
        
        alarms.push(alarm);
      }
    });
    
    // Save alarms
    await Alarm.insertMany(alarms);
    
    // Update site alarm counts
    console.log('Updating site alarm counts...');
    
    for (const site of sites) {
      const activeAlarmCount = await Alarm.countDocuments({ 
        siteId: site.name,
        status: { $ne: 'OK' },
        resolvedAt: null
      });
      
      // Update site status based on alarm count
      let siteStatus = 'OK';
      if (activeAlarmCount > 0) {
        if (activeAlarmCount > 5) {
          siteStatus = 'CRITICAL';
        } else if (activeAlarmCount > 3) {
          siteStatus = 'MAJOR';
        } else {
          siteStatus = 'WARNING';
        }
      }
      
      // Update site
      await Site.findByIdAndUpdate(site._id, {
        activeAlarms: activeAlarmCount,
        status: siteStatus
      });
      
      console.log(`Updated site ${site.name}: ${activeAlarmCount} active alarms, status ${siteStatus}`);
    }

    console.log('Database seeded successfully!');
    console.log(`Created ${alarms.length} alarms across ${sites.length} sites`);
    
    // Display test user credentials
    console.log('\nTest Users (from your existing database):');
    console.log('- Admin: username=admin');
    console.log('- Supervisor: username=supervisor');
    console.log('- Rabat Agent: username=rabat_iam');
    console.log('- Casa Agent: username=casa_iam');
    
    mongoose.disconnect();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();