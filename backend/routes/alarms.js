const express = require('express');
const router = express.Router();
const Alarm = require('../models/alarm');
const Site = require('../models/sites.js');
const { isSupervisorOrAdmin } = require('../middleware/auth');
const { processAlarmNotification } = require('../services/socketService');

// Get all alarms with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // For agents, only show alarms from their assigned sites
    if (req.user.role === 'agent') {
      query.siteId = { $in: req.user.sites };
    }
    
    const alarms = await Alarm.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Alarm.countDocuments(query);
    
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
    let query = {
      status: { $ne: 'OK' },
      resolvedAt: null
    };
    
    // For agents, filter by their accessible sites
    if (req.user.role === 'agent') {
      query.siteId = { $in: req.user.sites };
    }
    
    const activeAlarms = await Alarm.find(query).sort({ timestamp: -1 });
    res.json(activeAlarms);
  } catch (error) {
    console.error('Error getting active alarms:', error);
    res.status(500).json({ error: 'Failed to retrieve active alarms' });
  }
});

// Get alarms by site
router.get('/site/:siteId', async (req, res) => {
  try {
    const siteName = req.params.siteId.replace(/-/g, ' ');
    
    // Check if agent has access to this site
    if (req.user.role === 'agent') {
      // Normalize site names for comparison
      const normalizedSiteName = siteName.replace(/[\s-]/g, '').toLowerCase();
      const hasAccess = req.user.sites.some(userSite => {
        const normalizedUserSite = userSite.replace(/[\s-]/g, '').toLowerCase();
        return normalizedSiteName === normalizedUserSite;
      });
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have access to this site' });
      }
    }
    
    const alarms = await Alarm.getAlarmsBySite(siteName);
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
    
    // Handle site filtering
    if (siteId) {
      const siteName = siteId.replace(/-/g, ' ');
      
      // Check if agent has access to this site
      if (req.user.role === 'agent' && !req.user.sites.includes(siteName)) {
        return res.status(403).json({ error: 'You do not have access to this site' });
      }
      
      filter.siteId = siteName;
    } else if (req.user.role === 'agent') {
      // For agents without specific site, limit to their accessible sites
      filter.siteId = { $in: req.user.sites };
    }
    
    // Add other filters
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

// Get alarm statistics with time range support
router.get('/statistics', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Base filter to apply site restrictions for agents
    let baseFilter = {};
    if (req.user.role === 'agent') {
      baseFilter.siteId = { $in: req.user.sites };
    }
    
    const [
      critical, 
      major, 
      warning, 
      ok,
      total, 
      acknowledged, 
      unacknowledged
    ] = await Promise.all([
      Alarm.countDocuments({ ...baseFilter, status: 'CRITICAL', resolvedAt: null }),
      Alarm.countDocuments({ ...baseFilter, status: 'MAJOR', resolvedAt: null }),
      Alarm.countDocuments({ ...baseFilter, status: 'WARNING', resolvedAt: null }),
      Alarm.countDocuments({ ...baseFilter, status: 'OK' }),
      Alarm.countDocuments(baseFilter),
      Alarm.countDocuments({ ...baseFilter, acknowledgedAt: { $ne: null } }),
      Alarm.countDocuments({ ...baseFilter, acknowledgedAt: null, status: { $ne: 'OK' } })
    ]);
    
    // Get alarm counts by site
    // For agents, only get stats for their assigned sites
    let sites;
    if (req.user.role === 'agent') {
      sites = req.user.sites.map(siteName => ({ name: siteName }));
    } else {
      sites = await Site.find().select('name');
    }
    
    const siteStats = await Promise.all(
      sites.map(async (site) => {
        const criticalCount = await Alarm.countDocuments({ 
          siteId: site.name, 
          status: 'CRITICAL',
          resolvedAt: null
        });
        
        const majorCount = await Alarm.countDocuments({ 
          siteId: site.name, 
          status: 'MAJOR',
          resolvedAt: null
        });
        
        const warningCount = await Alarm.countDocuments({ 
          siteId: site.name, 
          status: 'WARNING',
          resolvedAt: null
        });
        
        const okCount = await Alarm.countDocuments({ 
          siteId: site.name, 
          status: 'OK'
        });
        
        return {
          name: site.name,
          critical: criticalCount,
          major: majorCount,
          warning: warningCount,
          ok: okCount
        };
      })
    );
    
    // Get time series data based on requested time range
    let timeSeriesData = {};
    
    // Hourly data for 24h view
    if (timeRange === '24h' || timeRange === 'live') {
      const hourlyData = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourStart.getHours() + 1);
        
        // Apply site filtering for agents
        const timeFilter = {
          timestamp: { $gte: hourStart, $lt: hourEnd },
          ...baseFilter
        };
        
        const [criticalCount, majorCount, warningCount] = await Promise.all([
          Alarm.countDocuments({
            ...timeFilter,
            status: 'CRITICAL'
          }),
          Alarm.countDocuments({
            ...timeFilter,
            status: 'MAJOR'
          }),
          Alarm.countDocuments({
            ...timeFilter,
            status: 'WARNING'
          })
        ]);
        
        hourlyData.push({
          label: hourStart.getHours().toString(),
          timestamp: hourStart,
          critical: criticalCount,
          major: majorCount,
          warning: warningCount
        });
      }
      
      timeSeriesData.hourly = hourlyData;
    }
    
    // Daily data for 7d view
    if (timeRange === '7d') {
      const dailyData = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        
        // Apply site filtering for agents
        const timeFilter = {
          timestamp: { $gte: dayStart, $lt: dayEnd },
          ...baseFilter
        };
        
        const [criticalCount, majorCount, warningCount] = await Promise.all([
          Alarm.countDocuments({
            ...timeFilter,
            status: 'CRITICAL'
          }),
          Alarm.countDocuments({
            ...timeFilter,
            status: 'MAJOR'
          }),
          Alarm.countDocuments({
            ...timeFilter,
            status: 'WARNING'
          })
        ]);
        
        const dayLabel = dayStart.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: 'numeric' 
        });
        
        dailyData.push({
          label: dayLabel,
          timestamp: dayStart,
          critical: criticalCount,
          major: majorCount,
          warning: warningCount
        });
      }
      
      timeSeriesData.daily = dailyData;
    }
    
    // Recent data (last 30 minutes in 5-minute intervals) for live view
    if (timeRange === 'live') {
      const recentData = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const intervalStart = new Date(now);
        intervalStart.setMinutes(now.getMinutes() - (i * 5), 0, 0);
        
        const intervalEnd = new Date(intervalStart);
        intervalEnd.setMinutes(intervalStart.getMinutes() + 5);
        
        // Apply site filtering for agents
        const timeFilter = {
          timestamp: { $gte: intervalStart, $lt: intervalEnd },
          ...baseFilter
        };
        
        const [criticalCount, majorCount, warningCount] = await Promise.all([
          Alarm.countDocuments({
            ...timeFilter,
            status: 'CRITICAL'
          }),
          Alarm.countDocuments({
            ...timeFilter,
            status: 'MAJOR'
          }),
          Alarm.countDocuments({
            ...timeFilter,
            status: 'WARNING'
          })
        ]);
        
        const timeLabel = `${intervalStart.getHours()}:${intervalStart.getMinutes().toString().padStart(2, '0')}`;
        
        recentData.push({
          label: timeLabel,
          timestamp: intervalStart,
          critical: criticalCount,
          major: majorCount,
          warning: warningCount
        });
      }
      
      timeSeriesData.recent = recentData;
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
      timeSeriesData
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
    
    // Check if agent has access to this alarm's site
    if (req.user.role === 'agent' && !req.user.sites.includes(alarm.siteId)) {
      return res.status(403).json({ error: 'You do not have access to this alarm' });
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
    
    // Check if agent has access to this alarm's site
    if (req.user.role === 'agent' && !req.user.sites.includes(alarm.siteId)) {
      return res.status(403).json({ error: 'You do not have access to this alarm' });
    }
    
    // Use the authenticated user's ID for acknowledgment
    await alarm.acknowledge(req.user.username);
    
    // Emit socket event to all applicable users
    const io = req.app.get('io');
    if (io) {
      const acknowledgementData = {
        alarmId: alarm._id,
        siteId: alarm.siteId,
        boxId: alarm.boxId,
        pinId: alarm.pinId,
        acknowledgedBy: req.user.username,
        acknowledgedAt: alarm.acknowledgedAt
      };
      
      // Emit to supervisors and admins
      io.to('all-sites').emit('alarm-acknowledged', acknowledgementData);
      
      // Emit to site-specific room for agents
      io.to(`site-${alarm.siteId.replace(/\s+/g, '-')}`).emit('alarm-acknowledged', acknowledgementData);
      
      // Process notification for acknowledgement
      // Clone alarm and modify for notification purposes
      const notificationAlarm = JSON.parse(JSON.stringify(alarm));
      notificationAlarm.description = `Alarm acknowledged by ${req.user.username}`;
      notificationAlarm.status = alarm.status; // Preserve original status
      notificationAlarm.type = 'ACKNOWLEDGEMENT';
      
      // Process notification
      await processAlarmNotification(notificationAlarm, io);
    }
    
    res.json({ success: true, alarm });
  } catch (error) {
    console.error(`Error acknowledging alarm ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to acknowledge alarm' });
  }
});

// Get alarm history for a specific site and timeframe
// Useful for generating reports
router.get('/history/:siteId', async (req, res) => {
  try {
    const siteName = req.params.siteId.replace(/-/g, ' ');
    const { startDate, endDate } = req.query;
    
    // Check if agent has access to this site
    if (req.user.role === 'agent' && !req.user.sites.includes(siteName)) {
      return res.status(403).json({ error: 'You do not have access to this site' });
    }
    
    const filter = {
      siteId: siteName
    };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const alarms = await Alarm.find(filter)
      .sort({ timestamp: -1 })
      .populate('statusHistory');
      
    res.json(alarms);
  } catch (error) {
    console.error(`Error getting alarm history for site ${req.params.siteId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve alarm history' });
  }
});

// Generate report (for supervisors and admins)
router.get('/report/generate', isSupervisorOrAdmin, async (req, res) => {
  try {
    const { siteId, startDate, endDate, format } = req.query;
    
    // Validate parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    // Build filter
    const filter = {};
    
    if (siteId) {
      filter.siteId = siteId.replace(/-/g, ' ');
    } else if (req.user.role === 'agent') {
      // For agents, limit to their sites
      filter.siteId = { $in: req.user.sites };
    }
    
    filter.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
    
    // Get alarms
    const alarms = await Alarm.find(filter).sort({ timestamp: -1 });
    
    // Simple JSON response for now
    // In a real implementation, you'd generate PDF/Excel/CSV based on format
    res.json({
      report: {
        generatedAt: new Date(),
        generatedBy: `${req.user.firstName} ${req.user.lastName}`,
        parameters: {
          siteId,
          startDate,
          endDate,
          format
        },
        summary: {
          totalAlarms: alarms.length,
          critical: alarms.filter(a => a.status === 'CRITICAL').length,
          major: alarms.filter(a => a.status === 'MAJOR').length,
          warning: alarms.filter(a => a.status === 'WARNING').length,
          ok: alarms.filter(a => a.status === 'OK').length,
          acknowledged: alarms.filter(a => a.acknowledgedAt !== null).length,
          unacknowledged: alarms.filter(a => a.acknowledgedAt === null && a.status !== 'OK').length
        },
        alarms
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Create a new alarm (typically from Modbus service or API)
router.post('/', async (req, res) => {
  try {
    // Create new alarm
    const alarm = new Alarm(req.body);
    await alarm.save();
    
    // Process notification
    const io = req.app.get('io');
    if (io && (alarm.status === 'CRITICAL' || alarm.status === 'MAJOR')) {
      await processAlarmNotification(alarm, io);
    }
    
    res.status(201).json(alarm);
  } catch (error) {
    console.error('Error creating alarm:', error);
    res.status(500).json({ error: 'Failed to create alarm' });
  }
});

// Update an alarm
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the original alarm to check for status changes
    const originalAlarm = await Alarm.findById(id);
    if (!originalAlarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    
    // Check permissions for agents
    if (req.user.role === 'agent' && !req.user.sites.includes(originalAlarm.siteId)) {
      return res.status(403).json({ error: 'You do not have access to this alarm' });
    }
    
    // Update the alarm
    const updatedAlarm = await Alarm.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    
    // Process notification for status changes
    const io = req.app.get('io');
    if (io && originalAlarm.status !== updatedAlarm.status) {
      // Add previous status for context
      updatedAlarm.previousStatus = originalAlarm.status;
      
      // Only send notifications for escalations to CRITICAL or MAJOR
      // or deescalations from CRITICAL or MAJOR to a lower level
      const wasHighPriority = ['CRITICAL', 'MAJOR'].includes(originalAlarm.status);
      const isHighPriority = ['CRITICAL', 'MAJOR'].includes(updatedAlarm.status);
      
      if (isHighPriority || wasHighPriority) {
        await processAlarmNotification(updatedAlarm, io);
      }
    }
    
    res.json(updatedAlarm);
  } catch (error) {
    console.error(`Error updating alarm ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update alarm' });
  }
});

module.exports = router;