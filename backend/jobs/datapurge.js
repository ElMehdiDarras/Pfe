// backend/jobs/dataPurge.js
const cron = require('node-cron');
const Alarm = require('../models/alarm');
const Notification = require('../models/notifications');
const RetentionSettings = require('../models/retentionSettings');
const moment = require('moment');

// Run daily at midnight
const schedule = '0 0 * * *';

const purgeOldData = async () => {
  try {
    console.log('Starting data purge job...');
    
    // Get retention settings
    const settings = await RetentionSettings.getSettings();
    const retentionPeriod = settings.retentionPeriod || 30; // Default to 30 days
    
    console.log(`Using retention period of ${retentionPeriod} days`);
    
    // Calculate cutoff date
    const cutoffDate = moment().subtract(retentionPeriod, 'days').toDate();
    
    console.log(`Deleting records older than ${cutoffDate.toISOString()}`);
    
    // Delete old alarms
    const alarmResult = await Alarm.deleteMany({ 
      timestamp: { $lt: cutoffDate } 
    });
    
    console.log(`Deleted ${alarmResult.deletedCount} old alarms`);
    
    // Delete old notifications
    const notificationResult = await Notification.deleteMany({ 
      timestamp: { $lt: cutoffDate } 
    });
    
    console.log(`Deleted ${notificationResult.deletedCount} old notifications`);
    
    // Log summary
    console.log('Data purge completed successfully');
    return {
      alarmsDeleted: alarmResult.deletedCount,
      notificationsDeleted: notificationResult.deletedCount
    };
  } catch (error) {
    console.error('Error in data purge job:', error);
    throw error;
  }
};

// Start the scheduled job
const initDataPurgeJob = () => {
  cron.schedule(schedule, async () => {
    try {
      await purgeOldData();
    } catch (error) {
      console.error('Scheduled data purge failed:', error);
    }
  });
  
  console.log(`Data purge job scheduled: ${schedule}`);
};

module.exports = {
  initDataPurgeJob,
  purgeOldData // Export for manual execution
};