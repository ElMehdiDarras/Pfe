// scripts/updateDBFromDocumentation.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Site = require('../models/sites');
const PinConfiguration = require('../models/pinConfiguration');
const User = require('../models/users');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Clear existing data to avoid duplicates
      await Site.deleteMany({});
      await PinConfiguration.deleteMany({});
      
      console.log('Cleared existing site and pin configuration data');
      
      // Define sites based on the PDF and screenshot
      const sites = [
        // ATCA Sites
        {
          name: 'Meknès HAMRIA II',
          description: 'Site de Meknès HAMRIA II ATCA',
          location: 'Meknès',
          vlan: '610',
          ipRange: '10.29.92.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme',
              ip: '10.29.92.41',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' },
            { name: 'Groupe Electrogène', type: 'Groupe Electrogène', status: 'OK' }
          ]
        },
        {
          name: 'Meknès HAMRIA III',
          description: 'Site de Meknès HAMRIA III ATCA',
          location: 'Meknès',
          vlan: '610',
          ipRange: '10.29.145.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme',
              ip: '10.29.145.245',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' }
            // Note: No Groupe Electrogène as per PDF
          ]
        },
        {
          name: 'Fès Ville Nouvelle',
          description: 'Site de Fès Ville Nouvelle ATCA',
          location: 'Fès',
          vlan: '630',
          ipRange: '10.29.94.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme',
              ip: '10.29.94.41',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' },
            { name: 'Groupe Electrogène', type: 'Groupe Electrogène', status: 'OK' }
          ]
        },
        {
          name: 'Fès AL ADARISSA',
          description: 'Site de Fès AL ADARISSA ATCA',
          location: 'Fès',
          vlan: '630',
          ipRange: '10.29.143.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme',
              ip: '10.29.143.94',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' },
            { name: 'Groupe Electrogène', type: 'Groupe Electrogène', status: 'OK' }
          ]
        },
        {
          name: 'Oujda Téléphone',
          description: 'Site d\'Oujda Téléphone ATCA',
          location: 'Oujda',
          vlan: '630',
          ipRange: '10.29.96.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme',
              ip: '10.29.96.41',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' },
            { name: 'Groupe Electrogène', type: 'Groupe Electrogène', status: 'OK' }
          ]
        },
        {
          name: 'Nador LGD',
          description: 'Site de Nador LGD ATCA',
          location: 'Nador',
          vlan: '630',
          ipRange: '10.29.98.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme',
              ip: '10.29.98.41',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 3', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' },
            { name: 'Groupe Electrogène', type: 'Groupe Electrogène', status: 'OK' }
          ]
        },
        {
          name: 'Settat LGD',
          description: 'Site de Settat LGD ATCA',
          location: 'Settat',
          vlan: '630',
          ipRange: '10.29.127.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme-1',
              ip: '10.29.127.41',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' },
            { name: 'Groupe Electrogène', type: 'Groupe Electrogène', status: 'OK' }
          ]
        },
        {
          name: 'Béni Mellal LGD',
          description: 'Site de Béni Mellal LGD ATCA',
          location: 'Béni Mellal',
          vlan: '630',
          ipRange: '10.29.125.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme-1',
              ip: '10.29.125.41',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Redresseur 1', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Redresseur 2', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 3', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 4', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' },
            { name: 'Centrale Incendie', type: 'Centrale Incendie', status: 'OK' },
            { name: 'Groupe Electrogène', type: 'Groupe Electrogène', status: 'OK' }
          ]
        },
        // SDM Sites
        {
          name: 'Rabat Hay NAHDA',
          description: 'Site de Rabat Hay NAHDA SDM',
          location: 'Rabat',
          vlan: '610',
          ipRange: '10.29.133.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme-1',
              ip: '10.29.133.21',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            },
            {
              name: 'Box Alarme-2',
              ip: '10.29.133.22',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Armoire DC -48 SDM NOKIA', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' }
          ]
        },
        {
          name: 'Rabat SOEKARNO',
          description: 'Site de Rabat SOEKARNO SDM',
          location: 'Rabat',
          vlan: '620',
          ipRange: '10.29.136.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme-1',
              ip: '10.29.136.21',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            },
            {
              name: 'Box Alarme-2',
              ip: '10.29.136.22',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Armoire DC -48 SDM NOKIA', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 3', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' }
          ]
        },
        {
          name: 'Casa Nations Unis',
          description: 'Site de Casablanca Nations Unis SDM',
          location: 'Casablanca',
          vlan: '630',
          ipRange: '10.29.139.0/24',
          status: 'OK',
          activeAlarms: 0,
          boxes: [
            {
              name: 'Box Alarme-1',
              ip: '10.29.139.21',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            },
            {
              name: 'Box Alarme-2',
              ip: '10.29.139.22',
              port: 50000,
              status: 'UP',
              lastSeen: new Date()
            }
          ],
          equipment: [
            { name: 'Armoire DC -48 SDM NOKIA', type: 'Armoire Electrique', status: 'OK' },
            { name: 'Climatiseur de précision 1', type: 'Climatiseur', status: 'OK' },
            { name: 'Climatiseur de précision 2', type: 'Climatiseur', status: 'OK' },
            { name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat', status: 'OK' }
          ]
        }
      ];

      // Insert sites
      console.log('Inserting sites...');
      const insertedSites = await Site.insertMany(sites);
      console.log(`Inserted ${insertedSites.length} sites.`);

      // Create pin configurations for each site
      console.log('Creating pin configurations...');
      const pinConfigurations = [];

      // Pin configurations from PDF for each site
      const siteConfigs = {
        // ATCA Sites
        'Meknès HAMRIA II': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 1', description: 'Haute Température Clim1', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 2', description: 'Haute Température Clim2', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 12, equipmentName: 'Groupe Electrogène', description: 'Défaut secteur Démarrage GE', alarmSeverity: 'CRITICAL' }
        ],
        'Meknès HAMRIA III': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 1', description: 'Haute Température Clim1', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 2', description: 'Haute Température Clim2', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' }
          // No pin 12 since there is no Groupe Electrogène
        ],
        'Fès Ville Nouvelle': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 1', description: 'Haute Température Clim1', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 2', description: 'Haute Température Clim2', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 12, equipmentName: 'Groupe Electrogène', description: 'Défaut secteur Démarrage GE', alarmSeverity: 'CRITICAL' }
        ],
        'Fès AL ADARISSA': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 1', description: 'Haute Température Clim1', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 2', description: 'Haute Température Clim2', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 12, equipmentName: 'Groupe Electrogène', description: 'Défaut secteur Démarrage GE', alarmSeverity: 'CRITICAL' }
        ],
        'Oujda Téléphone': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 1', description: 'Haute Température Clim1', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 2', description: 'Haute Température Clim2', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 12, equipmentName: 'Groupe Electrogène', description: 'Défaut secteur Démarrage GE', alarmSeverity: 'CRITICAL' }
        ],
        'Nador LGD': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 1', description: 'Haute Température Clim1', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 2', description: 'Haute Température Clim2', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 12, equipmentName: 'Groupe Electrogène', description: 'Défaut secteur Démarrage GE', alarmSeverity: 'CRITICAL' }
        ],
       'Settat LGD': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 1', description: 'Haute Température Clim1', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 2', description: 'Haute Température Clim2', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 12, equipmentName: 'Groupe Electrogène', description: 'Défaut secteur Démarrage GE', alarmSeverity: 'CRITICAL' }
        ],
        'Béni Mellal LGD': [
          { pinNumber: 1, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 2, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 3, equipmentName: 'Climatiseur de précision 3', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 4, equipmentName: 'Climatiseur de précision 4', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 5, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', alarmSeverity: 'CRITICAL' },
          { pinNumber: 6, equipmentName: 'Centrale Incendie', description: 'Alarme feu', alarmSeverity: 'CRITICAL' },
          { pinNumber: 7, equipmentName: 'Centrale Incendie', description: 'Alarme dérangement centrale incendie', alarmSeverity: 'MAJOR' },
          { pinNumber: 8, equipmentName: 'Redresseur 1', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 9, equipmentName: 'Redresseur 1', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 10, equipmentName: 'Redresseur 2', description: 'Défaut Secteur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 11, equipmentName: 'Redresseur 2', description: 'Défaut Redresseur', alarmSeverity: 'CRITICAL' },
          { pinNumber: 12, equipmentName: 'Groupe Electrogène', description: 'Défaut secteur Démarrage GE', alarmSeverity: 'CRITICAL' }
        ],
        // SDM Sites
        'Rabat Hay NAHDA': [
          // Box 1
          { pinNumber: 1, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 2, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 3, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 4, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 5, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 6, equipmentName: 'Climatiseur de précision 1', description: 'Alarme Dérangement Climatiseur', alarmSeverity: 'MAJOR', boxName: 'Box Alarme-1' },
          { pinNumber: 7, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          // Box 2
          { pinNumber: 1, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 2, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 3, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 4, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 5, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 6, equipmentName: 'Climatiseur de précision 2', description: 'Alarme Dérangement Climatiseur', alarmSeverity: 'MAJOR', boxName: 'Box Alarme-2' }
        ],
        'Rabat SOEKARNO': [
          // Box 1
          { pinNumber: 1, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 2, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 3, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 4, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 5, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 6, equipmentName: 'Climatiseur de précision 1', description: 'Alarme Dérangement Climatiseur', alarmSeverity: 'MAJOR', boxName: 'Box Alarme-1' },
          { pinNumber: 7, equipmentName: 'Climatiseur de précision 3', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 8, equipmentName: 'Climatiseur de précision 3', description: 'Alarme Dérangement Climatiseur', alarmSeverity: 'MAJOR', boxName: 'Box Alarme-1' },
          // Box 2
          { pinNumber: 1, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 2, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 3, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 4, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 5, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 6, equipmentName: 'Climatiseur de précision 2', description: 'Alarme Dérangement Climatiseur', alarmSeverity: 'MAJOR', boxName: 'Box Alarme-2' },
          { pinNumber: 7, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' }
        ],
        'Casa Nations Unis': [
          // Box 1
          { pinNumber: 1, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 2, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 3, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 4, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Normal', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 5, equipmentName: 'Climatiseur de précision 1', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          { pinNumber: 6, equipmentName: 'Climatiseur de précision 1', description: 'Alarme Dérangement Climatiseur', alarmSeverity: 'MAJOR', boxName: 'Box Alarme-1' },
          { pinNumber: 7, equipmentName: 'THERMOSTAT D\'AMBIANCE', description: 'Température Maximum dépassé', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-1' },
          // Box 2
          { pinNumber: 1, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NT-HLR -HSS Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 2, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 1 Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 3, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'ONE-NDS PDU 2 Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 4, equipmentName: 'Armoire DC -48 SDM NOKIA', description: 'NE-BR Défaut Alimentation DC Secours', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 5, equipmentName: 'Climatiseur de précision 2', description: 'Défaut Climatiseur', alarmSeverity: 'CRITICAL', boxName: 'Box Alarme-2' },
          { pinNumber: 6, equipmentName: 'Climatiseur de précision 2', description: 'Alarme Dérangement Climatiseur', alarmSeverity: 'MAJOR', boxName: 'Box Alarme-2' }
        ]
      };

      // Create pin configuration records
      for (const site of insertedSites) {
        const sitePins = siteConfigs[site.name];
        if (!sitePins) {
          console.log(`No pin configuration found for site: ${site.name}`);
          continue;
        }

        for (const box of site.boxes) {
          const boxPins = sitePins.filter(p => !p.boxName || p.boxName === box.name);
          for (const pin of boxPins) {
            pinConfigurations.push({
              siteId: site.name,
              boxId: box.name,
              pinNumber: pin.pinNumber,
              equipmentName: pin.equipmentName,
              description: pin.description,
              alarmSeverity: pin.alarmSeverity,
              normallyOpen: true // Default to normally open as per documentation
            });
          }
        }
      }

      // Insert pin configurations
      if (pinConfigurations.length > 0) {
        await PinConfiguration.insertMany(pinConfigurations);
        console.log(`Created ${pinConfigurations.length} pin configurations`);
      }

      // Create test users for different access levels and sites
      console.log('Creating users...');
      const users = [
        {
          username: 'admin',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'administrator',
          active: true
        },
        {
          username: 'superviseur',
          password: 'sup123',
          firstName: 'Super',
          lastName: 'Viseur',
          role: 'supervisor',
          active: true
        },
        {
          username: 'agent_rabat',
          password: 'agent123',
          firstName: 'Agent',
          lastName: 'Rabat',
          role: 'agent',
          sites: ['Rabat Hay NAHDA', 'Rabat SOEKARNO'],
          active: true
        },
        {
          username: 'agent_casa',
          password: 'agent123',
          firstName: 'Agent',
          lastName: 'Casa',
          role: 'agent',
          sites: ['Casa Nations Unis'],
          active: true
        },
        {
          username: 'agent_fes',
          password: 'agent123',
          firstName: 'Agent',
          lastName: 'Fes',
          role: 'agent',
          sites: ['Fès Ville Nouvelle', 'Fès AL ADARISSA'],
          active: true
        },
        {
          username: 'agent_meknes',
          password: 'agent123',
          firstName: 'Agent',
          lastName: 'Meknes',
          role: 'agent',
          sites: ['Meknès HAMRIA II', 'Meknès HAMRIA III'],
          active: true
        },
        {
          username: 'agent_est',
          password: 'agent123',
          firstName: 'Agent',
          lastName: 'Est',
          role: 'agent',
          sites: ['Oujda Téléphone', 'Nador LGD'],
          active: true
        },
        {
          username: 'agent_centre',
          password: 'agent123',
          firstName: 'Agent',
          lastName: 'Centre',
          role: 'agent',
          sites: ['Settat LGD', 'Béni Mellal LGD'],
          active: true
        }
      ];

      // Clear and create users
      await User.deleteMany({});
      console.log('Cleared existing user data');
      
      for (const userData of users) {
        await User.create(userData);
        console.log(`Created user: ${userData.username}`);
      }

      console.log('Database successfully updated with information from the PDF documentation');
    } catch (error) {
      console.error('Error updating database:', error);
    } finally {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });