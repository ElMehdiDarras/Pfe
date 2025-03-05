const mongoose = require('mongoose');
const Site = require('./models/sites');
const Alarm = require('./models/alarm');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';

// Sample site data without equipment initially
const siteData = [
  {
    name: 'Rabat-Hay-NAHDA',
    description: 'Site Type 1 à Hay NAHDA',
    location: 'Rabat',
    vlan: '610',
    ipRange: '10.29.133.0/24',
    status: 'CRITICAL',
    activeAlarms: 7,
    boxes: [
      {
        name: 'Box Alarme-1',
        ip: '10.29.133.21',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      },
      {
        name: 'Box Alarme-2',
        ip: '10.29.133.22',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      }
    ],
    // We'll add equipment after saving the site, as we need boxId to be an ObjectId
    equipment: []
  },
  {
    name: 'Rabat-Soekarno',
    description: 'Site Type 1 à Soekarno',
    location: 'Rabat',
    vlan: '620',
    ipRange: '10.29.136.0/24',
    status: 'WARNING',
    activeAlarms: 3,
    boxes: [
      {
        name: 'Box Alarme-1',
        ip: '10.29.136.21',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      },
      {
        name: 'Box Alarme-2',
        ip: '10.29.136.22',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      }
    ],
    equipment: []
  },
  {
    name: 'Casa-Nations-Unies',
    description: 'Site Type 2 à Nations Unies',
    location: 'Casablanca',
    vlan: '630',
    ipRange: '10.29.139.0/24',
    status: 'OK',
    activeAlarms: 0,
    boxes: [
      {
        name: 'Box Alarme-1',
        ip: '10.29.139.21',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      },
      {
        name: 'Box Alarme-2',
        ip: '10.29.139.22',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      }
    ],
    equipment: []
  }
];

// Equipment data we'll add after sites are created
const equipmentData = {
  'Rabat-Hay NAHDA': [
    {
      name: 'Armoire DC-48 SDM NOKIA',
      type: 'Armoire Électrique',
      status: 'CRITICAL',
      pinId: 'PIN_01'
    },
    {
      name: 'Climatiseur 1',
      type: 'Climatisation',
      status: 'MAJOR',
      pinId: 'PIN_05'
    },
    {
      name: 'THERMOSTAT D\'AMBIANCE',
      type: 'Thermostat',
      status: 'OK',
      pinId: 'PIN_07'
    }
  ],
  'Rabat-Soekarno': [
    {
      name: 'Armoire DC-48 SDM NOKIA',
      type: 'Armoire Électrique',
      status: 'OK',
      pinId: 'PIN_01'
    },
    {
      name: 'Climatiseur 1',
      type: 'Climatisation',
      status: 'WARNING',
      pinId: 'PIN_05'
    }
  ],
  'Casa-Nations Unies': [
    {
      name: 'Armoire DC-48 SDM NOKIA',
      type: 'Armoire Électrique',
      status: 'OK',
      pinId: 'PIN_01'
    },
    {
      name: 'Climatiseur 1',
      type: 'Climatisation',
      status: 'OK',
      pinId: 'PIN_05'
    }
  ]
};

// Sample alarm descriptions
const descriptions = [
  'Défaut Climatiseur',
  'Alarme Dérangement Climatiseur',
  'Température Maximum dépassé',
  'NT-HLR-HSS Défaut Alimentation DC Normal',
  'ONE-NDS PDU 1 Défaut Alimentation DC Normal',
  'ONE-NDS PDU 2 Défaut Alimentation DC Normal',
  'NE-BR Défaut Alimentation DC Normal'
];

// Connect to MongoDB and insert data
async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Site.deleteMany({});
    await Alarm.deleteMany({});
    console.log('Cleared existing data');

    // First, insert sites without equipment
    const sites = [];
    for (const siteInfo of siteData) {
      const site = new Site(siteInfo);
      await site.save();
      sites.push(site);
      console.log(`Created site: ${site.name}`);
    }

    // Now, add equipment to each site using the box IDs
    for (const site of sites) {
      const equipment = equipmentData[site.name];
      
      // Get first box ID from this site
      const boxId = site.boxes.length > 0 ? site.boxes[0]._id : null;
      
      if (boxId && equipment) {
        for (const equipItem of equipment) {
          // Add box ID reference as ObjectId
          site.equipment.push({
            ...equipItem,
            boxId: boxId
          });
        }
        await site.save();
        console.log(`Added equipment to site: ${site.name}`);
      }
    }

    // Generate alarms
    const alarms = [];
    for (const site of sites) {
      if (!site.equipment.length) continue;

      // Create current alarms for equipment with non-OK status
      for (const equip of site.equipment) {
        if (equip.status !== 'OK') {
          const alarm = new Alarm({
            siteId: site.name,
            boxId: site.boxes[0].name,  // Use box name instead of ID for easier frontend matching
            pinId: equip.pinId,
            equipment: equip.name,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            status: equip.status,
            timestamp: new Date(),
            acknowledgedBy: null,
            acknowledgedAt: null,
            resolvedAt: null,
            statusHistory: [
              {
                status: equip.status,
                timestamp: new Date()
              }
            ]
          });
          await alarm.save();
          alarms.push(alarm);
        }
      }

      // Create some historical alarms for each equipment
      for (const equip of site.equipment) {
        const statuses = ['OK', 'WARNING', 'MAJOR', 'CRITICAL'];
        
        for (let i = 0; i < 5; i++) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const date = new Date();
          date.setHours(date.getHours() - Math.floor(Math.random() * 24));
          
          const alarm = new Alarm({
            siteId: site.name,
            boxId: site.boxes[0].name,  // Use box name instead of ID for easier frontend matching
            pinId: equip.pinId,
            equipment: equip.name,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            status: status,
            timestamp: date,
            acknowledgedBy: status !== 'OK' ? null : 'system',
            acknowledgedAt: status !== 'OK' ? null : date,
            resolvedAt: status === 'OK' ? date : null,
            statusHistory: [
              {
                status: status,
                timestamp: date
              }
            ]
          });
          await alarm.save();
          alarms.push(alarm);
        }
      }
    }

    console.log(`Created ${alarms.length} alarms`);
    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();