// test-sites-api.js
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/users');

async function testApiSites() {
  try {
    // Connect to MongoDB to get user token
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring');
    const user = await User.findOne({ username: 'fes_agent' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      username: 'fes_agent',
      password: 'fes123'
    });
    
    const token = loginResponse.data.token;
    
    // Test sites endpoint
    const sitesResponse = await axios.get('http://localhost:5001/api/sites', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Sites API Response:', JSON.stringify(sitesResponse.data, null, 2));
    
    // If empty, try checking all sites as admin
    if (sitesResponse.data.length === 0) {
      console.log('\nChecking all sites as admin:');
      
      const adminLoginResponse = await axios.post('http://localhost:5001/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      const adminToken = adminLoginResponse.data.token;
      
      const allSitesResponse = await axios.get('http://localhost:5001/api/sites', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('All sites from API:', allSitesResponse.data.length);
      console.log('First site example:', JSON.stringify(allSitesResponse.data[0], null, 2));
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (mongoose.connection) await mongoose.connection.close();
  }
}

testApiSites();