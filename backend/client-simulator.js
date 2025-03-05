// client-simulator.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const packageDefinition = protoLoader.loadSync(path.join(__dirname, 'alarm.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const alarmProto = grpc.loadPackageDefinition(packageDefinition).alarm;

// Define available sites and boxes
const sites = [
  {
    id: 'Rabat-Hay-NAHDA',
    boxes: ['Box-1', 'Box-2']
  },
  {
    id: 'Rabat-Soekarno',
    boxes: ['Box-1', 'Box-2']
  },
  {
    id: 'Casa-Nations-Unies',
    boxes: ['Box-1', 'Box-2']
  }
];

// Create gRPC client
const client = new alarmProto.AlarmService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Set up alarm data stream
const call = client.streamAlarms((error, response) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Server response:', response);
});

// Define pin configurations for each site
const siteConfigurations = {
  'Rabat-Hay-NAHDA': [
    { id: 1, equipment: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 2, equipment: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 3, equipment: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 4, equipment: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 5, equipment: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', level: 'CRITICAL' },
    { id: 6, equipment: 'Climatiseur de précision 1', description: 'Alarme Dérangement Climatiseur', level: 'MAJOR' },
    { id: 7, equipment: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', level: 'CRITICAL' }
  ],
  'Rabat-Soekarno': [
    { id: 1, equipment: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 2, equipment: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 3, equipment: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 4, equipment: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 5, equipment: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', level: 'CRITICAL' },
    { id: 6, equipment: 'Climatiseur de précision 1', description: 'Alarme Dérangement Climatiseur', level: 'MAJOR' },
    { id: 7, equipment: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', level: 'CRITICAL' },
    { id: 8, equipment: 'Climatiseur de précision 2', description: 'Alarme Dérangement Climatiseur', level: 'MAJOR' },
    { id: 9, equipment: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', level: 'CRITICAL' }
  ],
  'Casa-Nations-Unies': [
    { id: 1, equipment: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 2, equipment: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 3, equipment: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 4, equipment: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Normal', level: 'CRITICAL' },
    { id: 5, equipment: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', level: 'CRITICAL' },
    { id: 6, equipment: 'Climatiseur de précision 1', description: 'Alarme Dérangement Climatiseur', level: 'MAJOR' },
    { id: 7, equipment: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', level: 'CRITICAL' }
  ]
};

// Function to randomly select site and box
function selectRandomSiteAndBox() {
  const site = sites[Math.floor(Math.random() * sites.length)];
  const boxId = site.boxes[Math.floor(Math.random() * site.boxes.length)];
  return { siteId: site.id, boxId };
}

// Function to randomly select alarm status
function getRandomStatus() {
  const statuses = ['OK', 'WARNING', 'MAJOR', 'CRITICAL'];
  const weights = [60, 15, 15, 10]; // 60% OK, 15% WARNING, 15% MAJOR, 10% CRITICAL
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const random = Math.random() * totalWeight;
  
  let weightSum = 0;
  for (let i = 0; i < statuses.length; i++) {
    weightSum += weights[i];
    if (random <= weightSum) {
      return statuses[i];
    }
  }
  
  return 'OK'; // Fallback
}

// Function to generate random alarms
function generateRandomAlarms() {
  // Select random site and box
  const { siteId, boxId } = selectRandomSiteAndBox();
  const pinConfigurations = siteConfigurations[siteId];
  
  // Create pin status array with varied statuses
  const pins = pinConfigurations.map(config => {
    const status = getRandomStatus();
    
    return {
      pin_id: config.id,
      equipment: config.equipment,
      description: config.description,
      status: status,
      level: config.level
    };
  });
  
  // Create the alarm update
  return {
    box_id: boxId,
    site_id: siteId,
    timestamp: new Date().toISOString(),
    pins: pins
  };
}

// Function to generate historical data points (for filling the graph)
function generateHistoricalData() {
  // Create data points for the last 24 hours
  const now = new Date();
  const hourlyPoints = [];
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() - i);
    timestamp.setMinutes(0, 0, 0);
    
    // For each hour, generate 1-3 random alarm points
    const pointCount = 1 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < pointCount; j++) {
      const alarmData = generateRandomAlarms();
      alarmData.timestamp = timestamp.toISOString();
      
      // Add some random minutes to spread within the hour
      const randomMinutes = Math.floor(Math.random() * 60);
      const pointTime = new Date(timestamp);
      pointTime.setMinutes(randomMinutes);
      alarmData.timestamp = pointTime.toISOString();
      
      hourlyPoints.push(alarmData);
    }
  }
  
  return hourlyPoints;
}

// Send historical data first (to populate graph)
async function sendHistoricalData() {
  console.log('Generating and sending historical data points...');
  const historyPoints = generateHistoricalData();
  
  // Send historical points with small delay between each
  for (const point of historyPoints) {
    console.log(`Sending historical point for ${point.site_id} at ${point.timestamp}`);
    call.write(point);
    
    // Small delay to avoid flooding
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('Historical data sent. Starting real-time simulation...');
  sendData();
}

// Send data periodically
function sendData() {
  const alarmData = generateRandomAlarms();
  console.log(`Sending real-time alarm data for ${alarmData.site_id}:`, JSON.stringify(alarmData, null, 2));
  call.write(alarmData);
  
  // Schedule next update (random interval between 5-15 seconds)
  const nextInterval = 5000 + Math.random() * 10000;
  setTimeout(sendData, nextInterval);
}

// Start sending data
console.log('Starting alarm data simulation...');
sendHistoricalData();

// Handle termination
process.on('SIGINT', () => {
  console.log('Closing gRPC client');
  call.end();
  process.exit();
});