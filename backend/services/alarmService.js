// services/alarmService.js
const Alarm = require('../models/alarm');
const Site = require('../models/sites');
const Notification = require('../models/notifications');
const { processNotification } = require('./socketService');

// Handle pin state changes
async function handlePinStateChange(siteName, boxName, pinNumber, newState, pinConfig) {
  try {
    // Determine if this is an alarm condition
    // normallyOpen: true means 0=normal, 1=alarm
    // normallyOpen: false means 1=normal, 0=alarm
    const isAlarmCondition = pinConfig.normallyOpen ? 
      (newState === 1) : (newState === 0);
    
    const status = isAlarmCondition ? 
      pinConfig.alarmSeverity : 'OK';
    
    // Find existing active alarm for this pin
    const existingAlarm = await Alarm.findOne({
      siteId: siteName,
      boxId: boxName,
      pinId: pinNumber.toString(),
      resolvedAt: null
    });
    
    if (isAlarmCondition) {
      // Create new alarm or update existing one
      if (existingAlarm) {
        // Only update if status is different
        if (existingAlarm.status !== status) {
          existingAlarm.status = status;
          existingAlarm.statusHistory.push({
            status: status,
            timestamp: new Date()
          });
          await existingAlarm.save();
          
          console.log(`Updated alarm status to ${status} for ${siteName}, box: ${boxName}, pin: ${pinNumber}`);
        }
      } else {
        // Create new alarm
        const newAlarm = new Alarm({
          siteId: siteName,
          boxId: boxName,
          pinId: pinNumber.toString(),
          equipment: pinConfig.equipmentName,
          description: pinConfig.description,
          status: status,
          timestamp: new Date(),
          statusHistory: [{
            status: status,
            timestamp: new Date()
          }]
        });
        
        await newAlarm.save();
        console.log(`Created new ${status} alarm for ${siteName}, box: ${boxName}, pin: ${pinNumber}`);
        
        // Process notification for new alarm
        await processAlarmNotification(newAlarm);
      }
    } else if (existingAlarm) {
      // Resolve existing alarm
      existingAlarm.status = 'OK';
      existingAlarm.resolvedAt = new Date();
      existingAlarm.statusHistory.push({
        status: 'OK',
        timestamp: new Date()
      });
      await existingAlarm.save();
      
      console.log(`Resolved alarm for ${siteName}, box: ${boxName}, pin: ${pinNumber}`);
      
      // Process notification for resolved alarm
      await processAlarmNotification({
        ...existingAlarm.toObject(),
        status: 'OK'
      });
    }
    
    // Update equipment status
    await Site.updateOne(
      { name: siteName, "equipment.name": pinConfig.equipmentName },
      { $set: { "equipment.$.status": status } }
    );
    
    // Update site status based on all active alarms
    await updateSiteStatus(siteName);
    
  } catch (error) {
    console.error(`Error handling pin state change:`, error);
  }
}

// Process alarm notification
async function processAlarmNotification(alarm) {
  try {
    // Create notification
    const notification = new Notification({
      userId: null, // Will be filled in by notification process
      message: `${alarm.siteId}: ${alarm.equipment} - ${alarm.description}`,
      type: 'ALARM',
      status: alarm.status,
      siteId: alarm.siteId,
      equipmentId: alarm.equipment,
      timestamp: new Date()
    });
    
    await notification.save();
    
    // Emit via socket service
    const io = global.io; // Assuming io is attached to global
    if (io) {
      processNotification(notification, io);
    }
  } catch (error) {
    console.error('Error processing alarm notification:', error);
  }
}

// Update site status based on all active alarms
async function updateSiteStatus(siteName) {
  try {
    // Get all active alarms for this site
    const activeAlarms = await Alarm.find({
      siteId: siteName,
      status: { $ne: 'OK' },
      resolvedAt: null
    });
    
    // Determine worst status
    let worstStatus = 'OK';
    let activeCount = 0;
    
    if (activeAlarms.length > 0) {
      activeCount = activeAlarms.length;
      
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
    }
    
    // Update site status
    await Site.updateOne(
      { name: siteName },
      { 
        $set: { 
          status: worstStatus,
          activeAlarms: activeCount
        }
      }
    );
    
  } catch (error) {
    console.error(`Error updating site status for ${siteName}:`, error);
  }
}

module.exports = {
  handlePinStateChange,
  processAlarmNotification,
  updateSiteStatus
};