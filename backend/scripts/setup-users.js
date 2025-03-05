require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/users');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring';

// Initial users to create
const initialUsers = [
  {
    username: 'admin',
    password: 'admin123', // Change in production!
    firstName: 'System',
    lastName: 'Administrator',
    role: 'administrator'
  },
  {
    username: 'supervisor',
    password: 'super123', // Change in production!
    firstName: 'Global',
    lastName: 'Supervisor',
    role: 'supervisor'
  },
  {
    username: 'rabat_iam',
    password: 'rabat123', // Change in production!
    firstName: 'Rabat',
    lastName: 'Agent',
    role: 'agent',
    sites: ['Rabat-Hay NAHDA', 'Rabat-SEOKARNO']
  }
];

async function setupUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if there are existing users
    const existingCount = await User.countDocuments();
    
    if (existingCount > 0) {
      console.log(`${existingCount} users already exist in the database.`);
      console.log('If you want to recreate users, please drop the existing user collection first.');
      return;
    }
    
    // Create initial users
    for (const userData of initialUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username} (${userData.role})`);
    }
    
    console.log('Initial users created successfully!');
  } catch (error) {
    console.error('Error setting up users:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
setupUsers();