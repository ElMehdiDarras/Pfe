const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['agent', 'supervisor', 'administrator'],
    default: 'agent'
  },
  // For agents, we need to specify which sites they can access
  sites: [{
    type: String  // Site names (e.g., "Rabat-Hay NAHDA", "Rabat-SEOKARNO", etc.)
  }],
  // For audit and security
  lastLogin: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password validity
userSchema.methods.validatePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      role: this.role,
      sites: this.sites
    },
    process.env.JWT_SECRET || 'alarm-manager-secret',
    { expiresIn: '8h' }
  );
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(username, password) {
  const user = await this.findOne({ username, active: true });
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  const isPasswordMatch = await user.validatePassword(password);
  if (!isPasswordMatch) {
    throw new Error('Invalid login credentials');
  }
  
  return user;
};

// Check if user can access a specific site
userSchema.methods.canAccessSite = function(siteName) {
  // Supervisors and administrators can access all sites
  if (this.role === 'supervisor' || this.role === 'administrator') {
    return true;
  }
  
  // Agents can only access their assigned sites
  return this.sites.includes(siteName);
};

// Check if user can modify settings
userSchema.methods.canModifySettings = function() {
  return this.role === 'administrator';
};

module.exports = mongoose.model('User', userSchema);