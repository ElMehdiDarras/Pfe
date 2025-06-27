// models/pinConfiguration.js
const mongoose = require('mongoose');

const pinConfigSchema = new mongoose.Schema({
  siteId: {
    type: String,
    required: true,
    index: true
  },
  boxId: {
    type: String,
    required: true
  },
  pinNumber: {
    type: Number,
    required: true
  },
  equipmentName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  alarmSeverity: {
    type: String,
    enum: ['CRITICAL', 'MAJOR', 'WARNING'],
    required: true
  },
  normallyOpen: {
    type: Boolean,
    required: true
  }
});

// Compound index for faster lookups
pinConfigSchema.index({ siteId: 1, boxId: 1, pinNumber: 1 }, { unique: true });

module.exports = mongoose.model('PinConfiguration', pinConfigSchema);