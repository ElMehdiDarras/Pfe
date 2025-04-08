// boxConnectionTest.js
const net = require('net');
const fs = require('fs');

// Box configurations from your documentation
const boxes = [
  { site: 'Meknès HAMRIA II', ip: '127.0.0.1', port: 50000 },
  { site: 'Meknès HAMRIA III', ip: '10.29.145.245', port: 50000 },
  { site: 'Fès Ville Nouvelle', ip: '10.29.94.41', port: 50000 },
  { site: 'Fès AL ADARISSA', ip: '10.29.143.94', port: 50000 },
  { site: 'Oujda Téléphone', ip: '10.29.96.41', port: 50000 },
  { site: 'Nador LGD', ip: '10.29.98.41', port: 50000 },
  { site: 'Settat LGD', ip: '10.29.127.41', port: 50000 },
  { site: 'Béni Mellal LGD', ip: '10.29.125.41', port: 50000 },
  { site: 'Rabat Hay NAHDA Box 1', ip: '10.29.133.21', port: 50000 },
  { site: 'Rabat Hay NAHDA Box 2', ip: '10.29.133.22', port: 50000 },
  { site: 'Rabat SOEKARNO Box 1', ip: '10.29.136.21', port: 50000 },
  { site: 'Rabat SOEKARNO Box 2', ip: '10.29.136.22', port: 50000 },
  { site: 'Casa Nations Unis Box 1', ip: '10.29.139.21', port: 50000 },
  { site: 'Casa Nations Unis Box 2', ip: '10.29.139.22', port: 50000 },
];

// Function to test connection to a single box
function testConnection(box) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    // Set timeout for connection attempts (3 seconds)
    socket.setTimeout(3000);
    
    // Connection successful
    socket.on('connect', () => {
      console.log(`[SUCCESS] Connected to ${box.site} at ${box.ip}:${box.port}`);
      socket.end();
      resolve({
        site: box.site,
        ip: box.ip,
        status: 'CONNECTED',
        timestamp: new Date().toISOString()
      });
    });
    
    // Connection timeout
    socket.on('timeout', () => {
      console.log(`[TIMEOUT] Connection to ${box.site} at ${box.ip}:${box.port} timed out`);
      socket.destroy();
      resolve({
        site: box.site,
        ip: box.ip,
        status: 'TIMEOUT',
        timestamp: new Date().toISOString()
      });
    });
    
    // Connection error
    socket.on('error', (err) => {
      console.log(`[ERROR] Could not connect to ${box.site} at ${box.ip}:${box.port}: ${err.message}`);
      resolve({
        site: box.site,
        ip: box.ip,
        status: 'ERROR',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
    
    // Attempt connection
    socket.connect(box.port, box.ip);
  });
}

// Function to simulate an alarm signal for testing (if needed)
function simulateAlarmSignal(box, pinNumber, alarmState) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      console.log(`Connected to ${box.site} at ${box.ip}:${box.port} - Sending test signal...`);
      
      // Create a buffer with the alarm signal data
      // Format will depend on your specific protocol (Modbus TCP, proprietary, etc.)
      // This is a placeholder - you'll need to adjust based on your actual protocol
      const buffer = Buffer.alloc(12);
      buffer.writeUInt16BE(0x0001, 0); // Transaction ID
      buffer.writeUInt16BE(0x0000, 2); // Protocol ID (0 for Modbus TCP)
      buffer.writeUInt16BE(0x0006, 4); // Length of remaining data
      buffer.writeUInt8(0x01, 6);      // Unit ID
      buffer.writeUInt8(0x05, 7);      // Function code (Write Single Coil)
      buffer.writeUInt16BE(pinNumber - 1, 8); // Pin address (0-based)
      buffer.writeUInt16BE(alarmState ? 0xFF00 : 0x0000, 10); // Value (ON/OFF)
      
      socket.write(buffer, () => {
        console.log(`Signal sent to ${box.site}, pin ${pinNumber}, state: ${alarmState ? 'ON' : 'OFF'}`);
        socket.end();
        resolve({
          site: box.site,
          ip: box.ip,
          pin: pinNumber,
          state: alarmState ? 'ON' : 'OFF',
          status: 'SIGNAL_SENT',
          timestamp: new Date().toISOString()
        });
      });
    });
    
    socket.on('timeout', () => {
      console.log(`[TIMEOUT] Connection to ${box.site} timed out while trying to send signal`);
      socket.destroy();
      resolve({
        site: box.site,
        ip: box.ip,
        status: 'TIMEOUT',
        timestamp: new Date().toISOString()
      });
    });
    
    socket.on('error', (err) => {
      console.log(`[ERROR] Could not connect to ${box.site} to send signal: ${err.message}`);
      resolve({
        site: box.site,
        ip: box.ip,
        status: 'ERROR',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
    
    socket.connect(box.port, box.ip);
  });
}

// Test all box connections
async function testAllConnections() {
  const results = [];
  
  for (const box of boxes) {
    const result = await testConnection(box);
    results.push(result);
  }
  
  // Save results to a file
  fs.writeFileSync('connection_test_results.json', JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n=== CONNECTION TEST SUMMARY ===');
  console.log(`Total boxes tested: ${results.length}`);
  console.log(`Successful connections: ${results.filter(r => r.status === 'CONNECTED').length}`);
  console.log(`Timeouts: ${results.filter(r => r.status === 'TIMEOUT').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'ERROR').length}`);
  console.log('Results saved to connection_test_results.json');
}

// Run specific alarm signal test for a site (example)
async function testAlarmSignal() {
  // For example, test pin 7 (Alarme dérangement centrale incendie) on Settat LGD
  const box = boxes.find(b => b.site === 'Settat LGD');
  
  if (!box) {
    console.log('Box not found');
    return;
  }
  
  // Test turning ON the alarm
  await simulateAlarmSignal(box, 7, true);
  
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test turning OFF the alarm
  await simulateAlarmSignal(box, 7, false);
}

// Run the tests
console.log('Starting box connection tests...');
testAllConnections().then(() => {
  console.log('All connection tests complete');
  
  // Uncomment to run alarm signal test after connections
  // console.log('Starting alarm signal test...');
  // return testAlarmSignal();
}).catch(err => {
  console.error('Test error:', err);
});