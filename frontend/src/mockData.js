// Static mock data to display in the interfaces
const sites = [
    {
      id: 'rabat-hay-nahda',
      name: 'Rabat-Hay NAHDA',
      vlan: '610',
      ipRange: '10.29.133.0/24',
      location: 'Salle équipements N°7',
      description: 'Site Type 1',
      status: 'WARNING',
      activeAlarms: 2,
      boxes: [
        { id: 'box-1', name: 'Box Alarme-1', ip: '10.29.133.21', status: 'UP' },
        { id: 'box-2', name: 'Box Alarme-2', ip: '10.29.133.22', status: 'UP' }
      ],
      equipment: [
        { id: 'equip-1', name: 'Armoire DC -48 SDM NOKIA', type: 'Armoire électrique' },
        { id: 'equip-2', name: 'Climatiseur de précision 1', type: 'Climatiseur' },
        { id: 'equip-3', name: 'Climatiseur de précision 2', type: 'Climatiseur' },
        { id: 'equip-4', name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat' }
      ]
    },
    {
      id: 'rabat-seokarno',
      name: 'Rabat-Soekarno',
      vlan: '620',
      ipRange: '10.29.136.0/24',
      location: 'Salle équipements',
      description: 'Site Type 1',
      status: 'CRITICAL',
      activeAlarms: 3,
      boxes: [
        { id: 'box-1', name: 'Box Alarme-1', ip: '10.29.136.21', status: 'UP' },
        { id: 'box-2', name: 'Box Alarme-2', ip: '10.29.136.22', status: 'UP' }
      ],
      equipment: [
        { id: 'equip-1', name: 'Armoire DC -48 SDM NOKIA', type: 'Armoire électrique' },
        { id: 'equip-2', name: 'Climatiseur de précision 1', type: 'Climatiseur' },
        { id: 'equip-3', name: 'Climatiseur de précision 2', type: 'Climatiseur' },
        { id: 'equip-4', name: 'Climatiseur de précision 3', type: 'Climatiseur' },
        { id: 'equip-5', name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat' }
      ]
    },
    {
      id: 'casa-nations-unies',
      name: 'Casa-Nations Unies',
      vlan: '630',
      ipRange: '10.29.139.0/24',
      location: 'Salle équipements',
      description: 'Site Type 2',
      status: 'OK',
      activeAlarms: 0,
      boxes: [
        { id: 'box-1', name: 'Box Alarme-1', ip: '10.29.139.21', status: 'UP' },
        { id: 'box-2', name: 'Box Alarme-2', ip: '10.29.139.22', status: 'UP' }
      ],
      equipment: [
        { id: 'equip-1', name: 'Armoire DC -48 SDM NOKIA', type: 'Armoire électrique' },
        { id: 'equip-2', name: 'Climatiseur de précision 1', type: 'Climatiseur' },
        { id: 'equip-3', name: 'Climatiseur de précision 2', type: 'Climatiseur' },
        { id: 'equip-4', name: 'THERMOSTAT D\'AMBIANCE', type: 'Thermostat' }
      ]
    }
  ];
  
  // Generate some static alarms
  const generateAlarms = () => {
    const statuses = ['OK', 'WARNING', 'MAJOR', 'CRITICAL'];
    const alarms = [];
  
    // Generate 50 random alarms with realistic data
    sites.forEach(site => {
      site.equipment.forEach(equip => {
        if (equip.type === 'Armoire électrique') {
          // Generate power alarms
          alarms.push({
            _id: `alarm-${alarms.length + 1}`,
            siteId: site.name,
            boxId: site.boxes[0].name,
            pinId: 'PIN_01',
            description: 'NT-HLR -HSS Défaut Alimentation DC Normal',
            status: Math.random() > 0.8 ? 'CRITICAL' : 'OK',
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
          });
          alarms.push({
            _id: `alarm-${alarms.length + 1}`,
            siteId: site.name,
            boxId: site.boxes[1].name,
            pinId: 'PIN_01',
            description: 'NT-HLR -HSS Défaut Alimentation DC Secours',
            status: Math.random() > 0.9 ? 'CRITICAL' : 'OK',
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
          });
        } else if (equip.type === 'Climatiseur') {
          // Generate climatization alarms
          alarms.push({
            _id: `alarm-${alarms.length + 1}`,
            siteId: site.name,
            boxId: site.boxes[0].name,
            pinId: 'PIN_05',
            description: `Défaut ${equip.name}`,
            status: Math.random() > 0.8 ? 'CRITICAL' : 'OK',
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
          });
          alarms.push({
            _id: `alarm-${alarms.length + 1}`,
            siteId: site.name,
            boxId: site.boxes[0].name,
            pinId: 'PIN_06',
            description: `Alarme Dérangement ${equip.name}`,
            status: Math.random() > 0.7 ? 'MAJOR' : 'OK',
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
          });
        } else if (equip.type === 'Thermostat') {
          // Generate temperature alarms
          alarms.push({
            _id: `alarm-${alarms.length + 1}`,
            siteId: site.name,
            boxId: site.boxes[0].name,
            pinId: 'PIN_07',
            description: 'Température Maximum dépassé',
            status: Math.random() > 0.9 ? 'CRITICAL' : 'OK',
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      });
    });
  
    return alarms;
  };
  
  const alarms = generateAlarms();
  
  // Filter to only active alarms (non-OK status)
  const activeAlarms = alarms.filter(alarm => alarm.status !== 'OK');
  
  // Generate data for the chart (last 24 hours)
  const last24HoursData = [...Array(24).keys()].map(hour => {
    return {
      hour: `${23-hour}h`,
      critical: Math.floor(Math.random() * 5),
      major: Math.floor(Math.random() * 8),
      warning: Math.floor(Math.random() * 10),
    };
  }).reverse();
  
  export default {
    sites,
    alarms,
    activeAlarms,
    last24HoursData,
    statistics: {
      total: alarms.length,
      critical: alarms.filter(a => a.status === 'CRITICAL').length,
      major: alarms.filter(a => a.status === 'MAJOR').length,
      warning: alarms.filter(a => a.status === 'WARNING').length,
      ok: alarms.filter(a => a.status === 'OK').length
    }
  };