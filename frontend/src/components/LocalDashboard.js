import React from 'react';
import { 
  Container, Grid, Paper, Typography, Box, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Card, CardContent
} from '@mui/material';

function LocalDashboard({ siteId, data }) {
  // Find site data for the specific local screen
  const site = data.sites.find(s => s.id === siteId) || data.sites[0];
  
  // Filter alarms for this site
  const siteAlarms = data.alarms.filter(alarm => 
    alarm.siteId === site.name && alarm.status !== 'OK'
  );
  
  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={8}>
            <Typography variant="h5" component="h1">
              Supervision Locale - {site.name}
            </Typography>
            <Typography variant="subtitle1">
              {site.location}
            </Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Chip 
              label={siteAlarms.length > 0 ? `${siteAlarms.length} Alarmes Actives` : "Système Normal"} 
              color={siteAlarms.length > 0 ? 'error' : 'success'} 
              sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                État des Équipements
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Équipement</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Dernière Vérification</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {site.equipment.map((equip, index) => {
                      // Simulate some alarms for the local view
                      const hasAlarm = siteAlarms.some(alarm => 
                        alarm.description.includes(equip.name)
                      );
                      
                      return (
                        <TableRow 
                          key={equip.id}
                          sx={{ 
                            bgcolor: hasAlarm ? 'rgba(255,0,0,0.05)' : 'inherit',
                            fontWeight: hasAlarm ? 'bold' : 'normal'
                          }}
                        >
                          <TableCell>{equip.name}</TableCell>
                          <TableCell>{equip.type}</TableCell>
                          <TableCell>
                            <Chip 
                              label={hasAlarm ? (index % 2 === 0 ? 'CRITIQUE' : 'MAJOR') : 'OK'} 
                              color={hasAlarm ? (index % 2 === 0 ? 'error' : 'warning') : 'success'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{new Date().toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alarmes Actives
              </Typography>
              {siteAlarms.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Équipement</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Horodatage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {siteAlarms.map((alarm) => (
                        <TableRow 
                          key={alarm._id}
                          sx={{ 
                            bgcolor: alarm.status === 'CRITICAL' ? 'rgba(255,0,0,0.05)' : 
                                   alarm.status === 'MAJOR' ? 'rgba(255,153,0,0.05)' : 
                                   'inherit'
                          }}
                        >
                          <TableCell>{alarm.boxId}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>
                            <Chip 
                              label={alarm.status} 
                              color={
                                alarm.status === 'CRITICAL' ? 'error' : 
                                alarm.status === 'MAJOR' ? 'warning' : 
                                alarm.status === 'WARNING' ? 'info' : 
                                'success'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{new Date(alarm.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1">
                    Aucune alarme active. Tous les systèmes fonctionnent normalement.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default LocalDashboard;