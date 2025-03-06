// fix-site-relationships.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users');
const Site = require('./models/sites');

async function fixSiteRelationships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-monitoring');
    console.log('Connected to MongoDB');
    
    // Get all sites and agents
    const sites = await Site.find({});
    const agents = await User.find({ role: 'agent' });
    
    console.log(`Found ${sites.length} sites and ${agents.length} agents`);
    
    // Create a map of site names and their normalized versions for quick lookup
    const siteMap = {};
    const siteIdMap = {};
    
    sites.forEach(site => {
      const normalizedName = normalizeString(site.name);
      siteMap[normalizedName] = site.name;
      siteIdMap[site.name] = site._id;
    });
    
    console.log('\n===== Site Mapping =====');
    for (const [normalized, original] of Object.entries(siteMap)) {
      console.log(`${normalized} => ${original}`);
    }
    
    // Fix site references for each agent
    let updatedUsers = 0;
    
    for (const agent of agents) {
      console.log(`\nChecking sites for ${agent.username}...`);
      let hasChanges = false;
      const validSites = [];
      
      for (const siteName of agent.sites) {
        const normalizedSiteName = normalizeString(siteName);
        
        if (siteMap[normalizedSiteName]) {
          // Site exists, but name might need normalization
          const correctSiteName = siteMap[normalizedSiteName];
          
          if (siteName !== correctSiteName) {
            console.log(`Fixing: "${siteName}" => "${correctSiteName}"`);
            validSites.push(correctSiteName);
            hasChanges = true;
          } else {
            console.log(`Valid: "${siteName}"`);
            validSites.push(siteName);
          }
        } else {
          // Site doesn't exist at all
          console.log(`❌ Site not found: "${siteName}"`);
          
          // Try to find the most similar site
          let bestMatch = null;
          let bestScore = 0;
          
          for (const site of sites) {
            const score = similarityScore(siteName, site.name);
            if (score > bestScore && score > 0.7) { // 70% similarity threshold
              bestScore = score;
              bestMatch = site.name;
            }
          }
          
          if (bestMatch) {
            console.log(`  Suggested match: "${bestMatch}" (similarity: ${Math.round(bestScore * 100)}%)`);
            console.log(`  Adding this match automatically`);
            validSites.push(bestMatch);
            hasChanges = true;
          }
        }
      }
      
      // Update the agent if changes were made
      if (hasChanges) {
        console.log(`Updating ${agent.username} with valid sites: ${validSites.join(', ')}`);
        agent.sites = validSites;
        await agent.save();
        updatedUsers++;
      } else {
        console.log(`No changes needed for ${agent.username}`);
      }
    }
    
    // Check for "Casa-Mohammedia" - this site was referenced but may not exist
    const casaMohammedSite = await Site.findOne({ name: 'Casa-Mohammedia' });
    
    if (!casaMohammedSite) {
      console.log('\n❗ Referenced site "Casa-Mohammedia" does not exist in the database.');
      console.log('Do you want to create this site? (y/n)');
      
      // Simulate user input (in a real script, you'd use readline)
      const createSite = 'y'; // Simulated "yes" answer
      
      if (createSite.toLowerCase() === 'y') {
        const newSite = new Site({
          name: 'Casa-Mohammedia',
          description: 'Site Type 2 à Mohammedia',
          location: 'Mohammedia',
          vlan: '680',
          ipRange: '10.29.180.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme-1',
              ip: '10.29.180.21',
              port: 502,
              status: 'UP',
              lastSeen: new Date()
            },
            {
              name: 'Box Alarme-2',
              ip: '10.29.180.22',
              port: 502,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            {
              name: 'Armoire Principale',
              type: 'Armoire Électrique',
              status: 'OK',
              pinId: 'PIN_01'
            },
            {
              name: 'Climatiseur Principal',
              type: 'Climatisation',
              status: 'OK',
              pinId: 'PIN_02'
            }
          ]
        });
        
        // Set box reference for equipment
        newSite.equipment.forEach(equip => {
          equip.boxId = newSite.boxes[0]._id;
        });
        
        await newSite.save();
        console.log('Created missing site: Casa-Mohammedia');
      } else {
        // Remove references to non-existent site
        for (const agent of agents) {
          if (agent.sites.includes('Casa-Mohammedia')) {
            console.log(`Removing reference to non-existent site "Casa-Mohammedia" from user ${agent.username}`);
            agent.sites = agent.sites.filter(site => site !== 'Casa-Mohammedia');
            await agent.save();
          }
        }
      }
    }
    
    console.log(`\nUpdated ${updatedUsers} users with corrected site references`);
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Helper function to normalize strings for comparison
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[\s-]+/g, '') // Remove spaces and hyphens
    .replace(/[^\w]/g, ''); // Remove any other non-word characters
}

// Helper function to calculate string similarity
function similarityScore(str1, str2) {
  str1 = normalizeString(str1);
  str2 = normalizeString(str2);
  
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Calculate Levenshtein distance
  const matrix = Array(str1.length + 1).fill().map(() => Array(str2.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[str1.length][str2.length];
  const maxLength = Math.max(str1.length, str2.length);
  
  // Return similarity score (1 - normalized distance)
  return 1 - (distance / maxLength);
}

fixSiteRelationships();
