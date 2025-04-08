const mongoose = require('mongoose');

// Define the Box schema
const boxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    default: 50000
  },
  status: {
    type: String,
    enum: ['UP', 'DOWN','UNREACHABLE'],
    default: 'UNREACHABLE'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

// Define the Equipment schema
const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OK', 'WARNING', 'MAJOR', 'CRITICAL', 'UNKNOWN'],
    default: 'OK'
  },
  boxId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Box'
  },
  pinId: {
    type: String
  }
});

const pinSchema = new mongoose.Schema({
  pinId: {
    type: String,
    required: true
  },
  equipmentName: {
    type: String,
    required: true
  },
  alarmLevel: {
    type: String,
    enum: ['OK', 'WARNING', 'MAJOR', 'CRITICAL'],
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

// Add to boxSchema
pins: [pinSchema]

// Define the Site schema
const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  vlan: {
    type: String
  },
  ipRange: {
    type: String
  },
  status: {
    type: String,
    enum: ['OK', 'WARNING', 'MAJOR', 'CRITICAL'],
    default: 'OK'
  },
  activeAlarms: {
    type: Number,
    default: 0
  },
  boxes: [boxSchema],
  equipment: [equipmentSchema],
  // Geographic coordinates for mapping
  coordinates: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
siteSchema.index({ name: 1 });
siteSchema.index({ status: 1 });

// Method to update site status based on equipment status
siteSchema.methods.updateStatus = function() {
  let worstStatus = 'OK';
  let activeAlarms = 0;
  
  // Check equipment status
  for (const equipment of this.equipment) {
    if (equipment.status !== 'OK') {
      activeAlarms++;
      if (equipment.status === 'CRITICAL') {
        worstStatus = 'CRITICAL';
      } else if (equipment.status === 'MAJOR' && worstStatus !== 'CRITICAL') {
        worstStatus = 'MAJOR';
      } else if (equipment.status === 'WARNING' && worstStatus !== 'CRITICAL' && worstStatus !== 'MAJOR') {
        worstStatus = 'WARNING';
      }
    }
  }
  
  this.status = worstStatus;
  this.activeAlarms = activeAlarms;
  return this.save();
};

// Static method to get sites with status summary
siteSchema.statics.getSitesWithStatus = function() {
  return this.find().select('name location vlan ipRange status activeAlarms');
};

module.exports = mongoose.model('Site', siteSchema);