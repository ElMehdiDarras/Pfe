const express = require('express');
const router = express.Router();
const Alarm = require('../models/alarm');
const Site = require('../models/sites.js');

// Get all alarms with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const alarms = await Alarm.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Alarm.countDocuments();
    
    res.json({
      alarms,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting alarms:', error);
    res.status(500).json({ error: 'Failed to retrieve alarms' });
  }
});

// Get active alarms (not OK or not resolved)
router.get('/active', async (req, res) => {
  try {
    const activeAlarms = await Alarm.getActiveAlarms();
    res.json(activeAlarms);
  } catch (error) {
    console.error('Error getting active alarms:', error);
    res.status(500).json({ error: 'Failed to retrieve active alarms' });
  }
});

// Get alarms by site
router.get('/site/:siteId', async (req, res) => {
  try {
    const alarms = await Alarm.getAlarmsBySite(req.params.siteId);
    res.json(alarms);
  } catch (error) {
    console.error(`Error getting alarms for site ${req.params.siteId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve site alarms' });
  }
});

// Get alarms with filtering
router.get('/filter', async (req, res) => {
  try {
    const { siteId, status, startDate, endDate, equipment } = req.query;
    const filter = {};
    
    if (siteId) filter.siteId = siteId;
    if (status) filter.status = status;
    if (equipment) filter.equipment = equipment;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const alarms = await Alarm.find(filter).sort({ timestamp: -1 });
    res.json(alarms);
  } catch (error) {
    console.error('Error filtering alarms:', error);
    res.status(500).json({ error: 'Failed to filter alarms' });
  }
});

// Get alarm statistics
router.get('/statistics', async (req, res) => {
  try {
    const [
      critical, 
      major, 
      warning, 
      ok,
      total, 
      acknowledged, 
      unacknowledged
    ] = await Promise.all([
      Alarm.countDocuments({ status: 'CRITICAL', resolvedAt: null }),
      Alarm.countDocuments({ status: 'MAJOR', resolvedAt: null }),
      Alarm.countDocuments({ status: 'WARNING', resolvedAt: null }),
      Alarm.countDocuments({ status: 'OK' }),
      Alarm.countDocuments(),
      Alarm.countDocuments({ acknowledgedAt: { $ne: null } }),
      Alarm.countDocuments({ acknowledgedAt: null, status: { $ne: 'OK' } })
    ]);
    
    // Get alarm counts by site
    const sites = await Site.find().select('name');
    const siteStats = await Promise.all(
      sites.map(async (site) => {
        const activeCount = await Alarm.countDocuments({ 
          siteId: site.name, 
          status: { $ne: 'OK' },
          resolvedAt: null
        });
        
        return {
          name: site.name,
          activeAlarms: activeCount
        };
      })
    );
    
    // Get last 24 hours alarm statistics
    const last24Hours = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      
      const criticalCount = await Alarm.countDocuments({
        status: 'CRITICAL',
        timestamp: { $gte: hourStart, $lt: hourEnd }
      });
      
      const majorCount = await Alarm.countDocuments({
        status: 'MAJOR',
        timestamp: { $gte: hourStart, $lt: hourEnd }
      });
      
      const warningCount = await Alarm.countDocuments({
        status: 'WARNING',
        timestamp: { $gte: hourStart, $lt: hourEnd }
      });
      
      last24Hours.push({
        hour: `${hourStart.getHours()}h`,
        critical: criticalCount,
        major: majorCount,
        warning: warningCount
      });
    }
    
    res.json({
      summary: {
        critical,
        major,
        warning,
        ok,
        total,
        acknowledged,
        unacknowledged
      },
      siteStats,
      last24Hours
    });
  } catch (error) {
    console.error('Error getting alarm statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve alarm statistics' });
  }
});

// Get a specific alarm
router.get('/:id', async (req, res) => {
  try {
    const alarm = await Alarm.findById(req.params.id);
    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    res.json(alarm);
  } catch (error) {
    console.error(`Error getting alarm ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve alarm' });
  }
});

// Acknowledge an alarm
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const alarm = await Alarm.findById(req.params.id);
    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    
    const userId = req.body.userId || 'system';
    await alarm.acknowledge(userId);
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('alarm-acknowledged', {
        alarmId: alarm._id,
        siteId: alarm.siteId,
        boxId: alarm.boxId,
        pinId: alarm.pinId,
        acknowledgedBy: userId,
        acknowledgedAt: alarm.acknowledgedAt
      });
    }
    
    res.json({ success: true, alarm });
  } catch (error) {
    console.error(`Error acknowledging alarm ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to acknowledge alarm' });
  }
});

module.exports = router;