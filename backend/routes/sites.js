const express = require('express');
const router = express.Router();
const Site = require('../models/sites');
const Alarm = require('../models/alarm');
const { auth } = require('../middleware/auth');

// Get all sites
router.get('/', auth, async (req, res) => {
  try {
    let sitesQuery = {};
    
    // If user is an agent, only return their assigned sites
    if (req.user.role === 'agent') {
      sitesQuery = { name: { $in: req.user.sites } };
    }
    
    const sites = await Site.find(sitesQuery);
    
    // Transform the data to make it frontend-friendly
    const transformedSites = sites.map(site => {
      const siteObj = site.toObject();
      // Add id field based on name (for frontend compatibility)
      siteObj.id = site.name.replace(/\s+/g, '-');
      return siteObj;
    });
    
    res.json(transformedSites);
  } catch (error) {
    console.error('Error getting sites:', error);
    res.status(500).json({ error: 'Failed to retrieve sites' });
  }
});
// In routes/sites.js
router.get('/summary', async (req, res) => {
  try {
    let sitesQuery = {};
    
    // If user is an agent, only return their assigned sites
    if (req.user && req.user.role === 'agent') {
      sitesQuery = { name: { $in: req.user.sites } };
    }
    
    // Get full site data including boxes and equipment arrays
    const sites = await Site.find(sitesQuery);
    
    // Transform the data with explicit counts
    const sitesWithCounts = sites.map(site => {
      // Convert Mongoose document to plain object
      const siteObj = site.toObject();
      
      // Add explicit counts
      siteObj.boxCount = site.boxes ? site.boxes.length : 0;
      siteObj.equipmentCount = site.equipment ? site.equipment.length : 0;
      
      // Add id field for frontend compatibility
      siteObj.id = site.name.replace(/\s+/g, '-');
      
      return siteObj;
    });
    
    res.json(sitesWithCounts);
  } catch (error) {
    console.error('Error getting site summary:', error);
    res.status(500).json({ error: 'Failed to retrieve site summary' });
  }
});
// Get a specific site
router.get('/:id', auth, async (req, res) => {
  try {
    // Try finding by MongoDB _id first
    let site = null;
    
    try {
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        // This is a valid MongoDB ObjectId
        site = await Site.findById(req.params.id);
      }
    } catch (err) {
      // Ignore error, try other methods
    }
    
    // If not found by _id, try by name
    if (!site) {
      const nameFromId = req.params.id.replace(/-/g, ' ');
      site = await Site.findOne({ name: nameFromId });
      
      // If still not found, try the original param
      if (!site) {
        site = await Site.findOne({ name: req.params.id });
      }
    }
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Check if agent has access to this site
    if (req.user.role === 'agent' && !req.user.sites.includes(site.name)) {
      return res.status(403).json({ error: 'You do not have access to this site' });
    }
    
    // Continue with the rest of your code...
    // ...
    
    res.json(site);
  } catch (error) {
    console.error(`Error getting site ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve site' });
  }
});

// Get site by name
router.get('/name/:name', async (req, res) => {
  try {
    const site = await Site.findOne({ name: req.params.name });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Get active alarms for this site
    const activeAlarms = await Alarm.find({
      siteId: site.name,
      status: { $ne: 'OK' },
      resolvedAt: null
    }).sort({ timestamp: -1 });
    
    // Convert to plain object and add alarms
    const siteWithAlarms = site.toObject();
    siteWithAlarms.activeAlarms = activeAlarms.length;
    siteWithAlarms.alarms = activeAlarms;
    siteWithAlarms.id = site.name.replace(/\s+/g, '-');
    
    res.json(siteWithAlarms);
  } catch (error) {
    console.error(`Error getting site ${req.params.name}:`, error);
    res.status(500).json({ error: 'Failed to retrieve site' });
  }
});
// Add to your routes/sites.js file on the backend
router.get('/debug-ids', auth, async (req, res) => {
  try {
    const sites = await Site.find({}).select('_id id name');
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new site
router.post('/', async (req, res) => {
  try {
    // Validate the request body
    if (!req.body.name || !req.body.location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    // Check if a site with the same name already exists
    const existingSite = await Site.findOne({ name: req.body.name });
    if (existingSite) {
      return res.status(409).json({ error: 'A site with this name already exists' });
    }
    
    const newSite = new Site(req.body);
    await newSite.save();
    
    // Add id for frontend compatibility
    const siteObj = newSite.toObject();
    siteObj.id = newSite.name.replace(/\s+/g, '-');
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('site-created', siteObj);
    }
    
    res.status(201).json(siteObj);
  } catch (error) {
    console.error('Error creating site:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// Update a site
router.put('/:id', async (req, res) => {
  try {
    // Don't allow name changes if it would create a duplicate
    if (req.body.name) {
      const existingSite = await Site.findOne({ 
        name: req.body.name,
        _id: { $ne: req.params.id } 
      });
      
      if (existingSite) {
        return res.status(409).json({ error: 'A site with this name already exists' });
      }
    }
    
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Add id for frontend compatibility
    const siteObj = site.toObject();
    siteObj.id = site.name.replace(/\s+/g, '-');
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('site-updated', siteObj);
    }
    
    res.json(siteObj);
  } catch (error) {
    console.error(`Error updating site ${req.params.id}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// Rest of the file remains the same
// Add a box to a site
router.post('/:id/boxes', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Validate required fields
    if (!req.body.name || !req.body.ip) {
      return res.status(400).json({ error: 'Name and IP address are required' });
    }
    
    // Check for duplicate box name
    const boxExists = site.boxes.some(box => box.name === req.body.name);
    if (boxExists) {
      return res.status(409).json({ error: 'A box with this name already exists' });
    }
    
    // Check for duplicate IP
    const ipExists = site.boxes.some(box => box.ip === req.body.ip);
    if (ipExists) {
      return res.status(409).json({ error: 'A box with this IP already exists' });
    }
    
    site.boxes.push(req.body);
    await site.save();
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('box-added', {
        siteId: site._id,
        box: site.boxes[site.boxes.length - 1]
      });
    }
    
    res.status(201).json(site.boxes[site.boxes.length - 1]);
  } catch (error) {
    console.error(`Error adding box to site ${req.params.id}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add box to site' });
  }
});

// Add equipment to a site
router.post('/:id/equipment', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Validate required fields
    if (!req.body.name || !req.body.type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    // Check for duplicate equipment name
    const equipExists = site.equipment.some(equip => equip.name === req.body.name);
    if (equipExists) {
      return res.status(409).json({ error: 'Equipment with this name already exists' });
    }
    
    site.equipment.push(req.body);
    await site.save();
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment-added', {
        siteId: site._id,
        equipment: site.equipment[site.equipment.length - 1]
      });
    }
    
    res.status(201).json(site.equipment[site.equipment.length - 1]);
  } catch (error) {
    console.error(`Error adding equipment to site ${req.params.id}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add equipment to site' });
  }
});

// Update site status based on active alarms
router.post('/:id/update-status', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Count active alarms for this site
    const activeAlarms = await Alarm.find({
      siteId: site.name,
      status: { $ne: 'OK' },
      resolvedAt: null
    });
    
    let worstStatus = 'OK';
    
    // Determine worst status
    for (const alarm of activeAlarms) {
      if (alarm.status === 'CRITICAL') {
        worstStatus = 'CRITICAL';
        break;
      } else if (alarm.status === 'MAJOR' && worstStatus !== 'CRITICAL') {
        worstStatus = 'MAJOR';
      } else if (alarm.status === 'WARNING' && worstStatus !== 'CRITICAL' && worstStatus !== 'MAJOR') {
        worstStatus = 'WARNING';
      }
    }
    
    site.status = worstStatus;
    site.activeAlarms = activeAlarms.length;
    await site.save();
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('site-status-updated', {
        siteId: site._id,
        siteName: site.name,
        status: site.status,
        activeAlarms: site.activeAlarms
      });
    }
    
    res.json({ status: site.status, activeAlarms: site.activeAlarms });
  } catch (error) {
    console.error(`Error updating status for site ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update site status' });
  }
});

// Update box status
router.put('/:id/boxes/:boxIndex', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const boxIndex = parseInt(req.params.boxIndex);
    if (isNaN(boxIndex) || boxIndex < 0 || boxIndex >= site.boxes.length) {
      return res.status(404).json({ error: 'Box not found' });
    }
    
    // Don't allow name changes if it would create a duplicate
    if (req.body.name) {
      const boxExists = site.boxes.some((box, idx) => 
        box.name === req.body.name && idx !== boxIndex
      );
      
      if (boxExists) {
        return res.status(409).json({ error: 'A box with this name already exists' });
      }
    }
    
    // Don't allow IP changes if it would create a duplicate
    if (req.body.ip) {
      const ipExists = site.boxes.some((box, idx) => 
        box.ip === req.body.ip && idx !== boxIndex
      );
      
      if (ipExists) {
        return res.status(409).json({ error: 'A box with this IP already exists' });
      }
    }
    
    // Update box fields
    Object.assign(site.boxes[boxIndex], req.body);
    await site.save();
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('box-updated', {
        siteId: site._id,
        boxIndex: boxIndex,
        box: site.boxes[boxIndex]
      });
    }
    
    res.json(site.boxes[boxIndex]);
  } catch (error) {
    console.error(`Error updating box for site ${req.params.id}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update box' });
  }
});

// Update equipment
router.put('/:id/equipment/:equipIndex', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const equipIndex = parseInt(req.params.equipIndex);
    if (isNaN(equipIndex) || equipIndex < 0 || equipIndex >= site.equipment.length) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Don't allow name changes if it would create a duplicate
    if (req.body.name) {
      const equipExists = site.equipment.some((equip, idx) => 
        equip.name === req.body.name && idx !== equipIndex
      );
      
      if (equipExists) {
        return res.status(409).json({ error: 'Equipment with this name already exists' });
      }
    }
    
    // Update equipment fields
    Object.assign(site.equipment[equipIndex], req.body);
    await site.save();
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment-updated', {
        siteId: site._id,
        equipIndex: equipIndex,
        equipment: site.equipment[equipIndex]
      });
    }
    
    res.json(site.equipment[equipIndex]);
  } catch (error) {
    console.error(`Error updating equipment for site ${req.params.id}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// Delete a box
router.delete('/:id/boxes/:boxIndex', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const boxIndex = parseInt(req.params.boxIndex);
    if (isNaN(boxIndex) || boxIndex < 0 || boxIndex >= site.boxes.length) {
      return res.status(404).json({ error: 'Box not found' });
    }
    
    // Get box info for notification before removing
    const removedBox = site.boxes[boxIndex];
    
    // Remove the box
    site.boxes.splice(boxIndex, 1);
    await site.save();
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('box-removed', {
        siteId: site._id,
        boxName: removedBox.name
      });
    }
    
    res.json({ success: true, message: 'Box removed successfully' });
  } catch (error) {
    console.error(`Error removing box from site ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to remove box' });
  }
});

// Delete equipment
router.delete('/:id/equipment/:equipIndex', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const equipIndex = parseInt(req.params.equipIndex);
    if (isNaN(equipIndex) || equipIndex < 0 || equipIndex >= site.equipment.length) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Get equipment info for notification before removing
    const removedEquip = site.equipment[equipIndex];
    
    // Remove the equipment
    site.equipment.splice(equipIndex, 1);
    await site.save();
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment-removed', {
        siteId: site._id,
        equipmentName: removedEquip.name
      });
    }
    
    res.json({ success: true, message: 'Equipment removed successfully' });
  } catch (error) {
    console.error(`Error removing equipment from site ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to remove equipment' });
  }
});

// Delete a site
router.delete('/:id', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const siteName = site.name;
    
    // Delete the site
    await Site.findByIdAndDelete(req.params.id);
    
    // Also delete all alarms for this site
    await Alarm.deleteMany({ siteId: siteName });
    
    // Notify connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('site-deleted', {
        siteId: req.params.id,
        siteName: siteName
      });
    }
    
    res.json({ success: true, message: 'Site and related alarms deleted successfully' });
  } catch (error) {
    console.error(`Error deleting site ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

module.exports = router;