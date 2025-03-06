// populate-database.js
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Site = require('../models/sites');
const Alarm = require('../models/alarm');
const User = require('../models/users');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';

// New sites to add
const newSites = [
  {
    name: 'Fes-Technopolis',
    description: 'Site Type 2 à Technopolis Fes',
    location: 'Fes',
    vlan: '640',
    ipRange: '10.29.140.0/24',
    status: 'OK',
    activeAlarms: 0,
    boxes: [
      {
        name: 'Box Alarme-1',
        ip: '10.29.140.21',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      },
      {
        name: 'Box Alarme-2',
        ip: '10.29.140.22',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      }
    ]
  },
  {
    name: 'Tanger-Datacenter',
    description: 'Site Type 1 à Tanger Datacenter',
    location: 'Tanger',
    vlan: '650',
    ipRange: '10.29.150.0/24',
    status: 'MAJOR',
    activeAlarms: 2,
    boxes: [
      {
        name: 'Box Alarme-1',
        ip: '10.29.150.21',
        port: 502,
        status: 'UP', 
        lastSeen: new Date()
      },
      {
        name: 'Box Alarme-2',
        ip: '10.29.150.22',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      }
    ]
  },
  {
    name: 'Marrakech-Centre',
    description: 'Site Type 1 à Marrakech Centre',
    location: 'Marrakech',
    vlan: '660',
    ipRange: '10.29.160.0/24',
    status: 'CRITICAL',
    activeAlarms: 4,
    boxes: [
      {
        name: 'Box Alarme-1',
        ip: '10.29.160.21',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      },
      {
        name: 'Box Alarme-2',
        ip: '10.29.160.22',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      }
    ]
  },
  {
    name: 'Agadir-Port',
    description: 'Site Type 2 à Agadir Port',
    location: 'Agadir',
    vlan: '670',
    ipRange: '10.29.170.0/24',
    status: 'WARNING',
    activeAlarms: 1,
    boxes: [
      {
        name: 'Box Alarme-1',
        ip: '10.29.170.21',
        port: 502, 
        status: 'UP',
        lastSeen: new Date()
      },
      {
        name: 'Box Alarme-2',
        ip: '10.29.170.22',
        port: 502,
        status: 'UP',
        lastSeen: new Date()
      }
    ]
  }
];

// Equipment templates for each site
const equipmentTemplates = {
  'Fes-Technopolis': [
    {
      name: 'Armoire DC-48 SDM',
      type: 'Armoire Électrique',
      status: 'OK',
      pinId: 'PIN_01'
    },
    {
      name: 'Climatiseur 1',
      type: 'Climatisation',
      status: 'OK',
      pinId: 'PIN_02'
    },
    {
      name: 'THERMOSTAT PRINCIPAL',
      type: 'Thermostat',
      status: 'OK',
      pinId: 'PIN_03'
    }
  ],
  'Tanger-Datacenter': [
    {
      name: 'Armoire Principale',
      type: 'Armoire Électrique',
      status: 'OK',
      pinId: 'PIN_01'
    },
    {
      name: 'Armoire Secours',
      type: 'Armoire Électrique',
      status: 'MAJOR',
      pinId: 'PIN_02'
    },
    {
      name: 'Climatiseur Salle 1',
      type: 'Climatisation',
      status: 'OK',
      pinId: 'PIN_03'
    },
    {
      name: 'Climatiseur Salle 2',
      type: 'Climatisation',
      status: 'MAJOR',
      pinId: 'PIN_04'
    },
    {
      name: 'Sonde Température',
      type: 'Thermostat',
      status: 'OK',
      pinId: 'PIN_05'
    }
  ],
  'Marrakech-Centre': [
    {
      name: 'Armoire Principale',
      type: 'Armoire Électrique',
      status: 'CRITICAL',
      pinId: 'PIN_01'
    },
    {
      name: 'Armoire Secondaire',
      type: 'Armoire Électrique',
      status: 'CRITICAL',
      pinId: 'PIN_02'
    },
    {
      name: 'Climatisation Salle Serveurs',
      type: 'Climatisation',
      status: 'CRITICAL',
      pinId: 'PIN_03'
    },
    {
      name: 'Climatisation Salle UPS',
      type: 'Climatisation',
      status: 'OK',
      pinId: 'PIN_04'
    },
    {
      name: 'Sonde Température Principale',
      type: 'Thermostat',
      status: 'WARNING',
      pinId: 'PIN_05'
    }
  ],
  'Agadir-Port': [
    {
      name: 'Armoire Principale',
      type: 'Armoire Électrique',
      status: 'OK',
      pinId: 'PIN_01'
    },
    {
      name: 'Climatiseur Principal',
      type: 'Climatisation',
      status: 'WARNING',
      pinId: 'PIN_02'
    },
    {
      name: 'Thermostat Ambiant',
      type: 'Thermostat',
      status: 'OK',
      pinId: 'PIN_03'
    }
  ]
};

// New users to add
const newUsers = [
  {
    username: 'fes_agent',
    password: 'fes123',
    firstName: 'Fes',
    lastName: 'Technician',
    role: 'agent',
    sites: ['Fes-Technopolis']
  },
  {
    username: 'tanger_agent',
    password: 'tanger123',
    firstName: 'Tanger',
    lastName: 'Technician',
    role: 'agent',
    sites: ['Tanger-Datacenter']
  },
  {
    username: 'south_agent',
    password: 'south123',
    firstName: 'South',
    lastName: 'Technician',
    role: 'agent',
    sites: ['Marrakech-Centre', 'Agadir-Port']
  },
  {
    username: 'super_north',
    password: 'north123',
    firstName: 'North',
    lastName: 'Supervisor',
    role: 'supervisor',
    sites: [] // Supervisor has access to all sites
  }
];

// Example alarm data (recent and historical)
const generateAlarms = (sites) => {
  const alarms = [];
  const now = new Date();
  
  sites.forEach(site => {
    const siteEquipment = equipmentTemplates[site.name] || [];
    
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
      
      // Add historical alarms
      for (let i = 1; i <= 5; i++) {
        const historyDate = new Date(now);
        historyDate.setHours(now.getHours() - (i * 4)); // Spread out every 4 hours
        
        alarms.push({
          siteId: site.name,
          boxId: site.boxes[0].name,
          pinId: equip.pinId,
          equipment: equip.name,
          description: `Défaut ${equip.type} - ${equip.name}`,
          status: Math.random() > 0.5 ? equip.status : 'OK', // Mix of OK and problem states
          timestamp: historyDate,
          acknowledgedBy: Math.random() > 0.7 ? 'admin' : null, // Some alarms acknowledged
          acknowledgedAt: Math.random() > 0.7 ? historyDate : null,
          resolvedAt: Math.random() > 0.5 ? new Date(historyDate.getTime() + 60*60*1000) : null // Some resolved an hour later
        });
      }
    });
  });
  
  return alarms;
};

// Function to populate database
async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check for existing data
    const existingSiteCount = await Site.countDocuments();
    const existingUserCount = await User.countDocuments();
    
    console.log(`Found ${existingSiteCount} existing sites and ${existingUserCount} existing users`);
    
    // Add new sites with equipment
    for (const siteData of newSites) {
      // Check if site already exists
      const existingSite = await Site.findOne({ name: siteData.name });
      if (existingSite) {
        console.log(`Site ${siteData.name} already exists, skipping...`);
        continue;
      }
      
      // Create the site
      const site = new Site(siteData);
      
      // Add equipment to the site
      const equipmentList = equipmentTemplates[site.name] || [];
      equipmentList.forEach(equipData => {
        // Add box reference (first box)
        equipData.boxId = site.boxes[0]._id;
        site.equipment.push(equipData);
      });
      
      await site.save();
      console.log(`Created site: ${site.name} with ${site.equipment.length} equipment items`);
    }
    
    // Create new users
    for (const userData of newUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`User ${userData.username} already exists, skipping...`);
        continue;
      }
      
      // Create the user
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username} (${userData.role})`);
    }
    
    // Get all sites for alarm generation
    const allSites = await Site.find({ name: { $in: Object.keys(equipmentTemplates) } });
    
    // Generate and create alarms
    const alarms = generateAlarms(allSites);
    
    if (alarms.length > 0) {
      // Remove any existing alarms for new sites to avoid duplicates
      await Alarm.deleteMany({ 
        siteId: { $in: newSites.map(site => site.name) } 
      });
      
      // Insert new alarms
      await Alarm.insertMany(alarms);
      console.log(`Created ${alarms.length} alarms`);
    }
    
    console.log('Database population completed successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
populateDatabase();