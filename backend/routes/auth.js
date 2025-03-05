const express = require('express');
const router = express.Router();
const User = require('../models/users');

const { auth, isAdmin } = require('../middleware/auth');

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await User.findByCredentials(username, password);
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    
    // Return user info and token
    res.json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sites: user.sites
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid login credentials' });
  }
});

// User logout
router.post('/logout', auth, async (req, res) => {
  // HTTP-only cookies can't be deleted by client-side JavaScript
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user info
router.get('/me', auth, async (req, res) => {
  // Return the current user's information
  res.json({
    id: req.user._id,
    username: req.user.username,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    sites: req.user.sites,
    lastLogin: req.user.lastLogin
  });
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    // Verify current password
    const isMatch = await req.user.validatePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    req.user.password = newPassword;
    req.user.passwordChangedAt = new Date();
    await req.user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// === ADMINISTRATIVE ENDPOINTS (only accessible by admins) ===

// Get all users (admin only)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Create a new user (admin only)
router.post('/users', auth, isAdmin, async (req, res) => {
  try {
    const { username, password, firstName, lastName, role, sites } = req.body;
    
    // Validate required fields
    if (!username || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    
    // Check for valid role
    if (!['agent', 'supervisor', 'administrator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    // Validate sites for agents
    if (role === 'agent' && (!sites || sites.length === 0)) {
      return res.status(400).json({ error: 'Agents must have at least one site assigned' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Create new user
    const user = new User({
      username,
      password, // Will be hashed by pre-save hook
      firstName,
      lastName,
      role,
      sites: sites || []
    });
    
    await user.save();
    
    // Don't return password in response
    const userObject = user.toObject();
    delete userObject.password;
    
    res.status(201).json(userObject);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update a user (admin only)
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { firstName, lastName, role, sites, active } = req.body;
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) {
      // Validate role
      if (!['agent', 'supervisor', 'administrator'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }
      user.role = role;
    }
    if (sites) user.sites = sites;
    if (active !== undefined) user.active = active;
    
    // Validate sites for agents
    if (user.role === 'agent' && (!user.sites || user.sites.length === 0)) {
      return res.status(400).json({ error: 'Agents must have at least one site assigned' });
    }
    
    await user.save();
    
    // Don't return password in response
    const userObject = user.toObject();
    delete userObject.password;
    
    res.json(userObject);
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset a user's password (admin only)
router.post('/users/:id/reset-password', auth, isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(`Error resetting password for user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't delete self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;