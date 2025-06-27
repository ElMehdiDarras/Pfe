// backend/models/retentionSettings.js
const mongoose = require('mongoose');

const retentionSettingsSchema = new mongoose.Schema({
  retentionPeriod: {
    type: Number,
    default: 30, // Default 30 days
    min: 1,
    max: 365
  },
  updatedBy: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure there's only one settings document
retentionSettingsSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // Create default settings if none exist
  const defaultSettings = new this({
    retentionPeriod: 30,
    updatedBy: 'System'
  });
  
  await defaultSettings.save();
  return defaultSettings;
};

module.exports = mongoose.model('RetentionSettings', retentionSettingsSchema);