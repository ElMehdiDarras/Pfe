require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/users');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';

// User to create
const userData = {
  username: 'casa_iam',
  password: 'casa123', // Change in production!
  firstName: 'Casa',
  lastName: 'Agent',
  role: 'agent',
  sites: ['Casa-Nations-Unies', 'Casa-Mohammedia']
};

async function setupUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if the user already exists
    const existingUser = await User.findOne({ username: userData.username });
    
    if (existingUser) {
      console.log(`User ${userData.username} already exists.`);
      return;
    }
    
    // Create the user
    const user = new User(userData);
    await user.save();
    console.log(`Created user: ${userData.username} (${userData.role})`);
    
    console.log('User created successfully!');
  } catch (error) {
    console.error('Error setting up user:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
setupUser();
