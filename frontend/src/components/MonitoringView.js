import React, { useState } from 'react';
import { 
  Container, Typography, Paper, Box, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress 
} from '@mui/material';
import { useData } from '../context/DataProvider';
import AlarmTable from './AlarmTable';

function MonitoringView() {
  const [activeTab, setActiveTab] = useState(0);
  const { sites, activeAlarms, loading, acknowledgeAlarm } = useData();
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Create lists of equipment from all sites
  const allBoxes = sites.flatMap(site => 
    (site.boxes || []).map(box => ({...box, site: site.name}))
  );
  
  const allEquipment = sites.flatMap(site => 
    (site.equipment || []).map(equip => ({...equip, site: site.name}))
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="div">
        Monitoring
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Hosts" />
            <Tab label="Services" />
            <Tab label="Boxes" />
            <Tab label="Equipements" />
            <Tab label="Problèmes" />
          </Tabs>
        </Box>
        
        {/* Content based on active tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Host</TableCell>
                    <TableCell>Adresse IP</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Dernière vérification</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>{site.name}</TableCell>
                      <TableCell>{site.ipRange && site.ipRange.split('/')[0]}</TableCell>
                      <TableCell>
                        <Chip 
                          label={site.status === 'OK' ? 'UP' : 'WARNING'} 
                          color={site.status === 'OK' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{site.location}</TableCell>
                      <TableCell>{new Date().toLocaleString()}</TableCell>
                      <TableCell>{site.status === 'OK' ? 'Host répondant normalement' : 'Présence d\'alarmes'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Services tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Host</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Dernière vérification</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sites.map((site) => (
                    <React.Fragment key={site.id}>
                      <TableRow>
                        <TableCell rowSpan={3}>{site.name}</TableCell>
                        <TableCell>PING</TableCell>
                        <TableCell>
                          <Chip label="OK" color="success" size="small" />
                        </TableCell>
                        <TableCell>{new Date().toLocaleString()}</TableCell>
                        <TableCell>PING OK - Packet loss = 0%, RTA = 0.80 ms</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>HTTP</TableCell>
                        <TableCell>
                          <Chip label="OK" color="success" size="small" />
                        </TableCell>
                        <TableCell>{new Date().toLocaleString()}</TableCell>
                        <TableCell>HTTP OK: HTTP/1.1 200 OK - 1.025 second response time</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>SNMP</TableCell>
                        <TableCell>
                          <Chip label={site.status === 'OK' ? 'OK' : 'WARNING'} color={site.status === 'OK' ? 'success' : 'warning'} size="small" />
                        </TableCell>
                        <TableCell>{new Date().toLocaleString()}</TableCell>
                        <TableCell>{site.status === 'OK' ? 'SNMP OK - System: Hardware=' + site.name : 'SNMP WARNING - Alarm trap received'}</TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Boxes tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Box</TableCell>
                    <TableCell>Adresse IP</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Dernière vérification</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allBoxes.map((box, index) => (
                    <TableRow key={index}>
                      <TableCell>{box.name}</TableCell>
                      <TableCell>{box.ip}</TableCell>
                      <TableCell>
                        <Chip 
                          label={box.status} 
                          color={box.status === 'UP' ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{box.site}</TableCell>
                      <TableCell>{new Date().toLocaleString()}</TableCell>
                      <TableCell>{box.status === 'UP' ? 'Box accessible via réseau' : 'Box inaccessible'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Equipements tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Equipement</TableCell>
                    <TableCell>NumPin</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Site et Lieu</TableCell>
                    <TableCell>Dernière vérification</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allEquipment.map((equip, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>{equip.name}</TableCell>
                        <TableCell>PIN_{String(index).padStart(2, '0')}</TableCell>
                        <TableCell>
                          <Chip 
                            label={equip.status} 
                            color={
                              equip.status === 'CRITICAL' ? 'error' : 
                              equip.status === 'MAJOR' ? 'warning' : 
                              equip.status === 'WARNING' ? 'info' : 'success'
                            } 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{equip.site}</TableCell>
                        <TableCell>{new Date().toLocaleString()}</TableCell>
                        <TableCell>
                          {equip.status === 'OK' ? 'Fonctionnement normal' : 
                           equip.status === 'WARNING' ? 'Avertissement - vérification recommandée' :
                           equip.status === 'MAJOR' ? 'Alarme dérangement' : 'Défaut critique'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Problèmes tab */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Problèmes Actifs
            </Typography>
            <AlarmTable 
              alarms={activeAlarms} 
              showAcknowledge={true} 
              onAcknowledge={acknowledgeAlarm}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default MonitoringView;