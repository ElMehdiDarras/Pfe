// backend/config/boxConfig.js
/**
 * Box configuration for all sites
 * Maps pins to equipment, descriptions, and alarm severities
 */
const boxConfig = {
    'Rabat_IAM Hay Emnahda': {
      boxes: [
        {
          id: 'Rabat_IAM Hay Emnahda_12IO_1',
          ip: '10.29.133.21',
          port: 50000,
          pins: [
            { 
              pin: 1, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NT-HLR -HSS Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 2, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 3, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 4, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NE-BR Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 5, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 6, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Alarme Dérangement Climatiseur',
              severity: 'MAJOR',
              normallyOpen: true
            },
            { 
              pin: 7, 
              equipment: 'THERMOSTAT D\'AMBIANCE', 
              description: 'Température Maximum dépassé',
              severity: 'CRITICAL',
              normallyOpen: true
            }
          ]
        },
        {
          id: 'Rabat_IAM Hay Emnahda_12IO_2',
          ip: '10.29.133.22',
          port: 50000,
          pins: [
            { 
              pin: 1, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NT-HLR -HSS Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 2, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 1 Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 3, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 2 Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 4, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NE-BR Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 5, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 6, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Alarme Dérangement Climatiseur',
              severity: 'MAJOR',
              normallyOpen: true
            }
          ]
        }
      ]
    },
    'Rabat_IAM SOEKARNO': {
      boxes: [
        {
          id: 'Rabat_IAM SOEKARNO_12IO_1',
          ip: '10.29.136.21',
          port: 50000,
          pins: [
            { 
              pin: 1, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NT-HLR -HSS Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 2, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 3, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 4, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NE-BR Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 5, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 6, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Alarme Dérangement Climatiseur',
              severity: 'MAJOR',
              normallyOpen: true
            },
            { 
              pin: 7, 
              equipment: 'Climatiseur de précision 3', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 8, 
              equipment: 'Climatiseur de précision 3', 
              description: 'Alarme Dérangement Climatiseur',
              severity: 'MAJOR',
              normallyOpen: true
            }
          ]
        },
        {
          id: 'Rabat_IAM SOEKARNO_12IO_2',
          ip: '10.29.136.22',
          port: 50000,
          pins: [
            { 
              pin: 1, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NT-HLR -HSS Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 2, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 1 Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 3, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 2 Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 4, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NE-BR Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 5, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 6, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Alarme Dérangement Climatiseur',
              severity: 'MAJOR',
              normallyOpen: true
            },
            { 
              pin: 7, 
              equipment: 'THERMOSTAT D\'AMBIANCE', 
              description: 'Température Maximum dépassé',
              severity: 'CRITICAL',
              normallyOpen: true
            }
          ]
        }
      ]
    },
    'Casa_Nations Unies': {
      boxes: [
        {
          id: 'Casa_Nations Unies_12IO_1',
          ip: '10.29.139.21',
          port: 50000,
          pins: [
            { 
              pin: 1, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NT-HLR -HSS Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 2, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 1 Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 3, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 2 Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 4, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NE-BR Défaut Alimentation DC Normal',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 5, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 6, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Alarme Dérangement Climatiseur',
              severity: 'MAJOR',
              normallyOpen: true
            },
            { 
              pin: 7, 
              equipment: 'THERMOSTAT D\'AMBIANCE', 
              description: 'Température Maximum dépassé',
              severity: 'CRITICAL',
              normallyOpen: true
            }
          ]
        },
        {
          id: 'Casa_Nations Unies_12IO_2',
          ip: '10.29.139.22',
          port: 50000,
          pins: [
            { 
              pin: 1, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NT-HLR -HSS Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 2, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 1 Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 3, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'ONE-NDS PDU 2 Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 4, 
              equipment: 'Armoire DC -48 SDM NOKIA', 
              description: 'NE-BR Défaut Alimentation DC Secours',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 5, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 6, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Alarme Dérangement Climatiseur',
              severity: 'MAJOR',
              normallyOpen: true
            }
          ]
        }
      ]
    },
    // ATCA sites below
    'Meknès-HAMRIA II': {
      boxes: [
        {
          id: 'Meknès-HAMRIA II_12IO_1',
          ip: '10.29.92.41',
          port: 50000,
          pins: [
            { 
              pin: 1, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 2, 
              equipment: 'Climatiseur de précision 1', 
              description: 'Haute Température Clim1',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 3, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Défaut Climatiseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 4, 
              equipment: 'Climatiseur de précision 2', 
              description: 'Haute Température Clim2',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 5, 
              equipment: 'THERMOSTAT D\'AMBIANCE', 
              description: 'Température Maximum dépassé',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 6, 
              equipment: 'Centrale Incendie', 
              description: 'Alarme feu',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 7, 
              equipment: 'Centrale Incendie', 
              description: 'Alarme Dérangement central incendie',
              severity: 'MAJOR',
              normallyOpen: true
            },
            { 
              pin: 8, 
              equipment: 'Redresseur', 
              description: 'Défaut Secteur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 9, 
              equipment: 'Redresseur', 
              description: 'Défaut Redresseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 10, 
              equipment: 'Redresseur', 
              description: 'Défaut Secteur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
              pin: 11, 
              equipment: 'Redresseur', 
              description: 'Défaut Redresseur',
              severity: 'CRITICAL',
              normallyOpen: true
            },
            { 
                pin: 12, 
                equipment: 'Groupe Electrogène', 
                description: 'Défaut secteur Démarrage GE',
                severity: 'CRITICAL',
                normallyOpen: true
              }
            ]
          }
        ]
      },
      'Meknès-HAMRIA III': {
        boxes: [
          {
            id: 'Meknès-HAMRIA III_12IO_1',
            ip: '10.29.145.245',
            port: 50000,
            pins: [
              { 
                pin: 1, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 2, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Haute Température Clim1',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 3, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 4, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Haute Température Clim2',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 5, 
                equipment: 'THERMOSTAT D\'AMBIANCE', 
                description: 'Température Maximum dépassé',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 6, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme feu',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 7, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme Dérangement central incendie',
                severity: 'MAJOR',
                normallyOpen: true
              },
              { 
                pin: 8, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 9, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 10, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 11, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              }
            ]
          }
        ]
      },
      'Fès-Ville Nouvelle': {
        boxes: [
          {
            id: 'Fès-Ville Nouvelle_12IO_1',
            ip: '10.29.94.41',
            port: 50000,
            pins: [
              { 
                pin: 1, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 2, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Haute Température Clim1',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 3, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 4, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Haute Température Clim2',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 5, 
                equipment: 'THERMOSTAT D\'AMBIANCE', 
                description: 'Température Maximum dépassé',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 6, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme feu',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 7, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme Dérangement central incendie',
                severity: 'MAJOR',
                normallyOpen: true
              },
              { 
                pin: 8, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 9, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 10, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 11, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 12, 
                equipment: 'Groupe Electrogène', 
                description: 'Défaut secteur Démarrage GE',
                severity: 'CRITICAL',
                normallyOpen: true
              }
            ]
          }
        ]
      },
      'Fès-ALADARISSA': {
        boxes: [
          {
            id: 'Fès-ALADARISSA_12IO_1',
            ip: '10.29.143.94',
            port: 50000,
            pins: [
              { 
                pin: 1, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 2, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Haute Température Clim1',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 3, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 4, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Haute Température Clim2',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 5, 
                equipment: 'THERMOSTAT D\'AMBIANCE', 
                description: 'Température Maximum dépassé',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 6, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme feu',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 7, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme Dérangement central incendie',
                severity: 'MAJOR',
                normallyOpen: true
              },
              { 
                pin: 8, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 9, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 10, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 11, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 12, 
                equipment: 'Groupe Electrogène', 
                description: 'Défaut secteur Démarrage GE',
                severity: 'CRITICAL',
                normallyOpen: true
              }
            ]
          }
        ]
      },
      'Oujda-Téléphone': {
        boxes: [
          {
            id: 'Oujda-Téléphone_12IO_1',
            ip: '10.29.96.41',
            port: 50000,
            pins: [
              { 
                pin: 1, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 2, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Haute Température Clim1',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 3, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 4, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Haute Température Clim2',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 5, 
                equipment: 'THERMOSTAT D\'AMBIANCE', 
                description: 'Température Maximum dépassé',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 6, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme feu',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 7, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme Dérangement central incendie',
                severity: 'MAJOR',
                normallyOpen: true
              },
              { 
                pin: 8, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 9, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 10, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 11, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 12, 
                equipment: 'Groupe Electrogène', 
                description: 'Défaut secteur Démarrage GE',
                severity: 'CRITICAL',
                normallyOpen: true
              }
            ]
          }
        ]
      },
      'Nador-LGD': {
        boxes: [
          {
            id: 'Nador-LGD_12IO_1',
            ip: '10.29.98.41',
            port: 50000,
            pins: [
              { 
                pin: 1, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 2, 
                equipment: 'Climatiseur de précision 1', 
                description: 'Haute Température Clim1',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 3, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Défaut Climatiseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 4, 
                equipment: 'Climatiseur de précision 2', 
                description: 'Haute Température Clim2',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 5, 
                equipment: 'THERMOSTAT D\'AMBIANCE', 
                description: 'Température Maximum dépassé',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 6, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme feu',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 7, 
                equipment: 'Centrale Incendie', 
                description: 'Alarme Dérangement central incendie',
                severity: 'MAJOR',
                normallyOpen: true
              },
              { 
                pin: 8, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 9, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 10, 
                equipment: 'Redresseur', 
                description: 'Défaut Secteur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 11, 
                equipment: 'Redresseur', 
                description: 'Défaut Redresseur',
                severity: 'CRITICAL',
                normallyOpen: true
              },
              { 
                pin: 12, 
                equipment: 'Groupe Electrogène', 
                description: 'Défaut secteur Démarrage GE',
                severity: 'CRITICAL',
                normallyOpen: true
              }
            ]
          }
        ]
      },
      'Settat-LGD': {
        boxes: [
          {
            id: 'Settat-LGD_12IO_1',
            ip: '10.29.127.41',
            port: 50000,
            pins: [
                { 
                    pin: 1, 
                    equipment: 'Climatiseur de précision 1', 
                    description: 'Défaut Climatiseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 2, 
                    equipment: 'Climatiseur de précision 1', 
                    description: 'Haute Température Clim1',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 3, 
                    equipment: 'Climatiseur de précision 2', 
                    description: 'Défaut Climatiseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 4, 
                    equipment: 'Climatiseur de précision 2', 
                    description: 'Haute Température Clim2',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 5, 
                    equipment: 'THERMOSTAT D\'AMBIANCE', 
                    description: 'Température Maximum dépassé',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 6, 
                    equipment: 'Centrale Incendie', 
                    description: 'Alarme feu',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 7, 
                    equipment: 'Centrale Incendie', 
                    description: 'Alarme Dérangement central incendie',
                    severity: 'MAJOR',
                    normallyOpen: true
                  },
                  { 
                    pin: 8, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Secteur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 9, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Redresseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 10, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Secteur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 11, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Redresseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 12, 
                    equipment: 'Groupe Electrogène', 
                    description: 'Défaut secteur Démarrage GE',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  }
                ]
              }
            ]
          },
          'Béni Mellal-LGD': {
            boxes: [
              {
                id: 'Béni Mellal-LGD_12IO_1',
                ip: '10.29.125.41',
                port: 50000,
                pins: [
                  { 
                    pin: 1, 
                    equipment: 'Climatiseur de précision 1', 
                    description: 'Défaut Climatiseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 2, 
                    equipment: 'Climatiseur de précision 2', 
                    description: 'Défaut Climatiseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 3, 
                    equipment: 'Climatiseur de précision 3', 
                    description: 'Défaut Climatiseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 4, 
                    equipment: 'Climatiseur de précision 4', 
                    description: 'Défaut Climatiseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 5, 
                    equipment: 'THERMOSTAT D\'AMBIANCE', 
                    description: 'Température Maximum dépassé',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 6, 
                    equipment: 'Centrale Incendie', 
                    description: 'Alarme feu',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 7, 
                    equipment: 'Centrale Incendie', 
                    description: 'Alarme Dérangement central incendie',
                    severity: 'MAJOR',
                    normallyOpen: true
                  },
                  { 
                    pin: 8, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Secteur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 9, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Redresseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 10, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Secteur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 11, 
                    equipment: 'Redresseur', 
                    description: 'Défaut Redresseur',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  },
                  { 
                    pin: 12, 
                    equipment: 'Groupe Electrogène', 
                    description: 'Défaut secteur Démarrage GE',
                    severity: 'CRITICAL',
                    normallyOpen: true
                  }
                ]
              }
            ]
          }
        };
        
        /**
         * Utility function to get box configuration by site name
         * Handles various forms of site names (with/without spaces, etc.)
         * 
         * @param {string} siteName - Site name to lookup
         * @returns {Object|null} Box configuration for the site or null if not found
         */
        boxConfig.getConfigForSite = function(siteName) {
          if (!siteName) return null;
          
          // Try direct lookup first
          if (this[siteName]) return this[siteName];
          
          // Normalize site name (remove spaces, convert to lowercase)
          const normalizedName = siteName.replace(/[\s_-]/g, '').toLowerCase();
          
          // Try to find a matching site with normalized name
          const siteKey = Object.keys(this).find(key => {
            // Skip function properties
            if (typeof this[key] === 'function') return false;
            
            const normalizedKey = key.replace(/[\s_-]/g, '').toLowerCase();
            return normalizedKey === normalizedName;
          });
          
          return siteKey ? this[siteKey] : null;
        };
        
        /**
         * Utility function to get pin configuration by site name, box IP and pin number
         * 
         * @param {string} siteName - Site name
         * @param {string} boxIP - Box IP address
         * @param {number} pinNumber - Pin number
         * @returns {Object|null} Pin configuration or null if not found
         */
        boxConfig.getPinConfig = function(siteName, boxIP, pinNumber) {
          const siteConfig = this.getConfigForSite(siteName);
          if (!siteConfig) return null;
          
          const box = siteConfig.boxes.find(b => b.ip === boxIP);
          if (!box) return null;
          
          return box.pins.find(p => p.pin === pinNumber) || null;
        };
        
        module.exports = boxConfig;