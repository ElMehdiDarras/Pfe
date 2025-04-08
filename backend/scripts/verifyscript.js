// backend/scripts/verify-simulator.js
const net = require('net');
const boxConfig = require('../config/boxConfig');

// Calculate port in the exact same way as bf2300Service and boxSimulator
function calculatePortFromIP(ipAddress) {
  // Extract IP parts
  const ipParts = ipAddress.split('.');
  if (ipParts.length !== 4) return 50000;
  
  // Use last two octets to create more unique port numbers
  const lastOctet = parseInt(ipParts[3]);
  const secondLastOctet = parseInt(ipParts[2]);
  
  // Calculate unique port number
  return 50000 + ((secondLastOctet * 100 + lastOctet) % 10000);
}

// Calculate CRC
function calculateCRC(data) {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc = (crc + data[i]) & 0xFF;
  }
  return crc;
}

// Create a command packet
function createCommandPacket(command) {
  const packet = Buffer.alloc(71);
  packet.writeUInt16BE(0xF0F0, 0); // Start flag
  packet.writeUInt16BE(command, 2); // Command
  packet.writeUInt16BE(0xF0F0, 68); // End flag
  packet[70] = calculateCRC(packet.slice(0, 70)); // CRC
  
  return packet;
}

// Test connection to a simulator
async function testSimulator(ip) {
  return new Promise((resolve, reject) => {
    const port = calculatePortFromIP(ip);
    console.log(`Testing connection to box at ${ip} on port ${port}...`);
    
    const socket = new net.Socket();
    let resolved = false;
    
    socket.on('connect', () => {
      console.log(`✅ Connected to simulator on localhost:${port}`);
      
      // Send read command
      const cmd = createCommandPacket(0x0001);
      socket.write(cmd);
      console.log('Sent read command');
    });
    
    socket.on('data', (data) => {
      if (resolved) return;
      
      console.log(`✅ Received ${data.length} bytes from simulator`);
      
      if (data.length === 71 && 
          data.readUInt16BE(0) === 0xF0F0 && 
          data.readUInt16BE(68) === 0xF0F0) {
        
        console.log('✅ Valid packet received');
        
        // Check command
        const cmd = data.readUInt16BE(2);
        console.log(`Command: 0x${cmd.toString(16)}`);
        
        if (cmd === 0x0001) {
          console.log('✅ Correct response command');
          
          // Extract pin states
          console.log('Pin states:');
          for (let i = 0; i < 12; i++) {
            console.log(`Pin ${i+1}: ${data[4+i] === 1 ? 'ON' : 'OFF'}`);
          }
          
          resolved = true;
          socket.destroy();
          resolve(true);
        }
      }
    });
    
    socket.on('error', (err) => {
      console.error(`❌ Error: ${err.message}`);
      if (!resolved) {
        resolved = true;
        socket.destroy();
        reject(err);
      }
    });
    
    socket.on('close', () => {
      console.log('Connection closed');
      if (!resolved) {
        resolved = true;
        reject(new Error('Connection closed without response'));
      }
    });
    
    // Set timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        reject(new Error('Test timed out after 5 seconds'));
      }
    }, 5000);
    
    // Connect
    socket.connect(port, 'localhost');
  });
}

// Main function
async function main() {
  // Get first box from config
  let firstBox = null;
  let firstSite = null;
  
  for (const siteName in boxConfig) {
    if (typeof boxConfig[siteName] === 'object' && boxConfig[siteName] !== null &&
        typeof boxConfig[siteName] !== 'function' && boxConfig[siteName].boxes) {
      
      const site = boxConfig[siteName];
      if (site.boxes && site.boxes.length > 0) {
        firstSite = siteName;
        firstBox = site.boxes[0];
        break;
      }
    }
  }
  
  if (!firstBox) {
    console.error('No boxes found in configuration!');
    process.exit(1);
  }
  
  console.log(`Testing connection to box ${firstBox.id} (${firstBox.ip})...`);
  
  try {
    await testSimulator(firstBox.ip);
    console.log('\n✅ Simulator test successful!');
    console.log('Now start your server with:');
    console.log('  USE_SIMULATOR=true node server.js');
  } catch (error) {
    console.error('\n❌ Simulator test failed:', error.message);
    console.log('\nPossible causes:');
    console.log('1. Simulator is not running - start it with "node boxSimulator.js"');
    console.log('2. Simulator is using a different port calculation - check both files');
    console.log('3. Firewall is blocking connections');
    
    process.exit(1);
  }
}

// Run main
main();