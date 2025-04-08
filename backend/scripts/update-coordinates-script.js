// update-coordinates.js
// Script to update MongoDB site documents with realistic coordinates
// Run with: node update-coordinates.js

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import Site model - you might need to adjust the path based on your project structure
const Site = require('/home/mhdi/Desktop/alarm-monitoring-system/backend/models/sites.js');

// Real-world coordinates for Moroccan cities
const cityCoordinates = {
  // Main cities with approximate telecom center coordinates
  'Rabat': { latitude: 34.022405, longitude: -6.834543 },
  'Casablanca': { latitude: 33.589886, longitude: -7.603869 },
  'Fès': { latitude: 34.033333, longitude: -5.000000 },
  'Meknès': { latitude: 33.897778, longitude: -5.554722 },
  'Oujda': { latitude: 34.680839, longitude: -1.900156 },
  'Nador': { latitude: 35.174412, longitude: -2.928770 },
  'Settat': { latitude: 33.001431, longitude: -7.616230 },
  'Béni Mellal': { latitude: 32.336274, longitude: -6.360679 }
};

// Function to add slight variation to coordinates for sites in the same city
function getVariedCoordinates(baseCity, siteName) {
  if (!cityCoordinates[baseCity]) {
    console.error(`No coordinates found for city: ${baseCity}`);
    return null;
  }

  // Start with the base coordinates
  const base = cityCoordinates[baseCity];
  
  // Add slight variation (approximately 0.5-2 km) based on site name
  // This ensures different sites in the same city have distinct but realistic coordinates
  // Using a deterministic approach based on site name so coordinates remain consistent
  
  // Hash the site name to a number
  const hash = siteName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use the hash to generate a small latitude and longitude offset
  // Convert to a value between -0.01 and 0.01 (roughly 1km depending on location)
  const latOffset = ((hash % 100) / 5000) - 0.01;
  const lngOffset = (((hash * 2) % 100) / 5000) - 0.01;
  
  return {
    latitude: base.latitude + latOffset,
    longitude: base.longitude + lngOffset
  };
}

// Function to extract city from site name and description
function extractCity(site) {
  // First check the location field which should contain the city
  if (site.location) {
    return site.location;
  }
  
  // If location doesn't match a known city, try to extract from name
  const siteNameParts = site.name.split(' ');
  for (const part of siteNameParts) {
    if (cityCoordinates[part]) {
      return part;
    }
  }
  
  // As a fallback, look for city names in the description
  if (site.description) {
    for (const city in cityCoordinates) {
      if (site.description.includes(city)) {
        return city;
      }
    }
  }
  
  // If all else fails, default to Rabat as a fallback
  console.warn(`Could not determine city for site: ${site.name}, defaulting to Rabat`);
  return 'Rabat';
}

// Main function to update coordinates for all sites
async function updateSiteCoordinates() {
  try {
    // Get all sites
    const sites = await Site.find();
    console.log(`Found ${sites.length} sites to update`);
    
    // Update each site with coordinates
    for (const site of sites) {
      // Determine the city
      const city = extractCity(site);
      
      // Get varied coordinates for this site based on the city
      const coords = getVariedCoordinates(city, site.name);
      
      if (coords) {
        // Update the site with coordinates
        site.coordinates = coords;
        await site.save();
        console.log(`Updated coordinates for ${site.name} (${city}): ${coords.latitude}, ${coords.longitude}`);
      } else {
        console.error(`Failed to update coordinates for ${site.name}`);
      }
    }
    
    console.log('All sites updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating site coordinates:', error);
    process.exit(1);
  }
}

// Run the update function
updateSiteCoordinates();
