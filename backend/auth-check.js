// update-site-status.js
require('dotenv').config();
const mongoose = require('mongoose');
const Site = require('./models/sites');

async function updateSiteStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring');
    
    // Find the Fes-Technopolis site
    const site = await Site.findOne({ name: 'Fes-Technopolis' });
    
    if (!site) {
      console.log('Site not found');
      return;
    }
    
    console.log('Current site status:', {
      name: site.name,
      status: site.status,
      activeAlarms: site.activeAlarms,
      equipment: site.equipment.length,
      boxes: site.boxes.length
    });
    
    // Make sure site has equipment and is active
    if (site.equipment.length === 0) {
      console.log('Adding sample equipment to site');
      
      site.equipment = [
        {
          name: 'Armoire Principale',
          type: 'Armoire Électrique',
          status: 'OK',
          boxId: site.boxes[0]._id,
          pinId: 'PIN_01'
        },
        {
          name: 'Climatiseur Principal',
          type: 'Climatisation',
          status: 'WARNING',
          boxId: site.boxes[0]._id,
          pinId: 'PIN_02'
        }
      ];
      
      site.activeAlarms = 1;
      site.status = 'WARNING';
      
      await site.save();
      console.log('Site updated with equipment and active status');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) await mongoose.connection.close();
  }
}

updateSiteStatus();