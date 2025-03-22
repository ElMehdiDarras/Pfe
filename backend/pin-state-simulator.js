// pin-state-simulator.js
require('dotenv').config();
const { MongoClient } = require('mongodb');
const axios = require('axios');

// Get configuration from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';
const API_BASE_URL = 'http://localhost:5001/api'; // Adjusted to your PORT=5001
const JWT_SECRET = process.env.JWT_SECRET;

// Sites to simulate alarms on
const SITES_TO_TEST = [
  { name: 'Meknès Hamria II', boxId: 'Box Alarme-1', pinId: '1' },
  { name: 'Fès Ville Nouvelle', boxId: 'Box Alarme-1', pinId: '11' }
];

// Connect to MongoDB
async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create an alarm directly in the database to bypass auth
async function createAlarmInDb(db, site, boxId, pinId, status) {
  try {
    const alarmData = {
      siteId: site,
      boxId: boxId,
      pinId: pinId,
      equipment: 'Climatiseur de précision 1',
      description: 'Défaut Climatiseur - Test Simulation',
      status: status, // 'CRITICAL', 'MAJOR', 'WARNING', 'OK'
      timestamp: new Date(),
      statusHistory: [{
        status: status,
        timestamp: new Date()
      }]
    };

    console.log(`Creating ${status} alarm for ${site}...`);
    
    const result = await db.collection('alarms').insertOne(alarmData);
    console.log(`Alarm created successfully for ${site} with ID: ${result.insertedId}`);
    
    // Also update site status based on the alarm
    await updateSiteStatus(db, site, status);
    
    return result.insertedId;
  } catch (error) {
    console.error(`Error creating alarm for ${site}:`, error);
    return null;
  }
}

// Update site status based on alarm
async function updateSiteStatus(db, siteName, alarmStatus) {
  try {
    // Only update if the alarm is not OK
    if (alarmStatus === 'OK') return;
    
    // Determine site status based on alarm status
    let siteStatus = 'OK';
    if (alarmStatus === 'CRITICAL') siteStatus = 'CRITICAL';
    else if (alarmStatus === 'MAJOR') siteStatus = 'MAJOR';
    else if (alarmStatus === 'WARNING') siteStatus = 'WARNING';
    
    console.log(`Updating site ${siteName} status to ${siteStatus}`);
    
    const result = await db.collection('sites').updateOne(
      { name: siteName },
      { 
        $set: { 
          status: siteStatus,
          activeAlarms: 1
        }
      }
    );
    
    console.log(`Site status update result:`, result);
  } catch (error) {
    console.error(`Error updating site status for ${siteName}:`, error);
  }
}

// Update equipment status in a site
async function updateEquipmentStatus(db, siteName, equipmentName, status) {
  try {
    const result = await db.collection('sites').updateOne(
      { name: siteName, "equipment.name": equipmentName },
      { $set: { "equipment.$.status": status } }
    );
    
    console.log(`Equipment status update result:`, result);
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Error updating equipment status for ${siteName}:`, error);
    return false;
  }
}

// Main simulation function
async function runSimulation() {
  const db = await connectToMongo();
  
  console.log('Starting alarm simulation...');
  
  // Process each site sequentially
  for (const site of SITES_TO_TEST) {
    // 1. Create a CRITICAL alarm in the database
    const alarmId = await createAlarmInDb(
      db, 
      site.name, 
      site.boxId, 
      site.pinId, 
      'CRITICAL' // Set to CRITICAL
    );
    
    if (alarmId) {
      console.log(`Successfully created alarm for ${site.name}`);
      
      // 2. Update equipment status too
      await updateEquipmentStatus(
        db,
        site.name,
        'Climatiseur de précision 1',
        'CRITICAL'
      );
      
      // Wait a bit between sites to make changes more visible
      console.log(`Waiting 5 seconds before next site...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log(`Failed to create alarm for ${site.name}`);
    }
  }
  
  console.log('Simulation completed');
  
  // Wait a bit and then reset all alarms
  console.log('Waiting 20 seconds before resetting alarms...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  console.log('Resetting alarms to normal state...');
  
  for (const site of SITES_TO_TEST) {
    // Create an "OK" alarm to clear the previous alarm
    const resetAlarmId = await createAlarmInDb(
      db, 
      site.name, 
      site.boxId, 
      site.pinId, 
      'OK' // Set status to OK
    );
    
    if (resetAlarmId) {
      console.log(`Reset alarm for ${site.name}`);
      
      // Also reset equipment status
      await updateEquipmentStatus(
        db,
        site.name,
        'Climatiseur de précision 1',
        'OK'
      );
      
      // Also reset site status
      await db.collection('sites').updateOne(
        { name: site.name },
        { 
          $set: { 
            status: 'OK',
            activeAlarms: 0
          }
        }
      );
    }
    
    // Small delay between sites
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('Simulation reset completed');
  process.exit(0);
}

// Run the simulation
runSimulation().catch(error => {
  console.error('Simulation failed:', error);
  process.exit(1);
});