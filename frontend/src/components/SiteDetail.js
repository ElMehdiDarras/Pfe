import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Paper, Typography, Box, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Card, CardContent, CircularProgress, Button, Pagination
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataProvider';

function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { sites, alarms, loading, fetchAllData } = useData();
  const [alarmPage, setAlarmPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const rowsPerPage = 10; // Number of rows per page
  const dataFetchedRef = useRef(false);
  
  console.log('SiteDetail - siteId:', siteId);
  
  // Different ways to find the site (try various ID formats)
  const site = sites.find(s => s.id === siteId) || 
               sites.find(s => s.name === siteId) ||
               sites.find(s => s._id === siteId) ||  // Add MongoDB _id check
               sites.find(s => s.id?.replace(/-/g, ' ') === siteId) ||
               sites.find(s => s.name?.replace(/-/g, ' ') === siteId);
  
  // Only fetch data once when needed to prevent infinite loop
  useEffect(() => {
    if (!loading && sites.length > 0 && !site && !dataFetchedRef.current) {
      console.log('Site not found, refreshing data once...');
      dataFetchedRef.current = true;
      fetchAllData();
    }
  }, [siteId, sites, site, loading, fetchAllData]);

  // Reset pagination when tab changes
  useEffect(() => {
    setAlarmPage(1);
    setHistoryPage(1);
  }, [activeTab]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleBack = () => {
    navigate('/overview');
  };

  const handleAlarmPageChange = (event, newPage) => {
    setAlarmPage(newPage);
  };

  const handleHistoryPageChange = (event, newPage) => {
    setHistoryPage(newPage);
  };

  // Function to get status chip
  const getStatusChip = (status) => {
    let color = 'default';
    
    switch(status) {
      case 'CRITICAL':
        color = 'error';
        break;
      case 'MAJOR':
        color = 'warning';
        break;
      case 'WARNING':
        color = 'info';
        break;
      case 'OK':
        color = 'success';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString || 'N/A';
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!site) {
    return (
      <Container sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack} 
          sx={{ mb: 2 }}
        >
          Retour au tableau de bord
        </Button>
        <Typography variant="h4">Site non trouvé</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Le site avec l'identifiant "{siteId}" n'a pas été trouvé. Voici les sites disponibles:
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>VLAN</TableCell>
                <TableCell>Emplacement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sites.map(s => (
                <TableRow key={s.id || s._id}>
                  <TableCell>{s.id || s._id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.vlan}</TableCell>
                  <TableCell>{s.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    );
  }
  
  // Filter alarms for this site - try with both ID and name
  const siteAlarms = alarms.filter(alarm => 
    alarm.siteId === site.id || 
    alarm.siteId === site._id ||
    alarm.siteId === site.name ||
    (site.id && alarm.siteId === site.id.replace(/-/g, ' ')) ||
    (site.name && alarm.siteId === site.name.replace(/-/g, ' '))
  );
  
  // Active alarms (not OK status)
  const activeAlarms = siteAlarms.filter(a => a.status !== 'OK');
  
  // Paginated active alarms
  const paginatedActiveAlarms = activeAlarms.slice(
    (alarmPage - 1) * rowsPerPage,
    alarmPage * rowsPerPage
  );
  
  // Paginated history alarms
  const paginatedHistoryAlarms = siteAlarms.slice(
    (historyPage - 1) * rowsPerPage,
    historyPage * rowsPerPage
  );
  
  // Create a simplified history chart
  const alarmHistory = [...Array(24).keys()].map(hour => {
    const hourAlarms = siteAlarms.filter(alarm => {
      if (!alarm.timestamp) return false;
      try {
        const alarmDate = new Date(alarm.timestamp);
        return alarmDate.getHours() === hour;
      } catch (e) {
        return false;
      }
    });
    
    return {
      hour: `${hour}h`,
      alarms: hourAlarms.length,
      critical: hourAlarms.filter(a => a.status === 'CRITICAL').length,
      major: hourAlarms.filter(a => a.status === 'MAJOR').length,
      warning: hourAlarms.filter(a => a.status === 'WARNING').length
    };
  });
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack} 
        sx={{ mb: 2 }}
      >
        Retour au tableau de bord
      </Button>
      <Typography variant="h4" gutterBottom component="div">
        {site.name}
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        {site.description || `Site Type ${site.name.includes('Nations') ? '2' : '1'}`} | VLAN: {site.vlan} | {site.location}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Vue d'ensemble" />
                <Tab label="Équipements" />
                <Tab label="Alarmes" />
                <Tab label="Historique" />
              </Tabs>
            </Box>
            
            {/* Overview tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Détails du Site
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">Nom</TableCell>
                                <TableCell>{site.name}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">VLAN</TableCell>
                                <TableCell>{site.vlan}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Plage IP</TableCell>
                                <TableCell>{site.ipRange}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Emplacement</TableCell>
                                <TableCell>{site.location}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Statut</TableCell>
                                <TableCell>
                                  {site.status === 'OK' ? (
                                    <Chip label="OK" color="success" size="small" />
                                  ) : site.status === 'WARNING' ? (
                                    <Chip label="Avertissement" color="warning" size="small" />
                                  ) : (
                                    <Chip label="Critique" color="error" size="small" />
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Nombre de Boxes</TableCell>
                                <TableCell>{site.boxes ? site.boxes.length : 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Nombre d'Équipements</TableCell>
                                <TableCell>{site.equipment ? site.equipment.length : 0}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Activité des Alarmes
                        </Typography>
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={alarmHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="critical" name="Critique" stroke="#f44336" dot={false} />
                            <Line type="monotone" dataKey="major" name="Majeure" stroke="#ff9800" dot={false} />
                            <Line type="monotone" dataKey="warning" name="Warning" stroke="#ffeb3b" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Dernières Alarmes
                </Typography>
                <TableContainer component={Paper}>
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
                      {siteAlarms.slice(0, 5).map((alarm, index) => (
                        <TableRow key={alarm._id || index}>
                          <TableCell>{alarm.boxId}{alarm.equipment ? ` - ${alarm.equipment}` : ''}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>{getStatusChip(alarm.status)}</TableCell>
                          <TableCell>{formatDate(alarm.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                      {siteAlarms.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">Aucune alarme à afficher</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {/* Rest of tabs remain the same */}
            {/* Equipment tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Boxes de Surveillance
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Adresse IP</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Dernière vérification</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(site.boxes || []).map((box, index) => (
                        <TableRow key={box.id || box._id || index}>
                          <TableCell>{box.name}</TableCell>
                          <TableCell>{box.ip}</TableCell>
                          <TableCell>
                            <Chip 
                              label={box.status || 'UP'} 
                              color={(box.status || 'UP') === 'UP' ? 'success' : 'error'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{new Date().toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {(!site.boxes || site.boxes.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">Aucune box à afficher</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Typography variant="h6" gutterBottom>
                  Équipements Surveillés
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(site.equipment || []).map((equip, index) => (
                        <TableRow key={equip.id || equip._id || index}>
                          <TableCell>{equip.name}</TableCell>
                          <TableCell>{equip.type || 'Équipement'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={equip.status || 'OK'} 
                              color={
                                (equip.status || 'OK') === 'CRITICAL' ? 'error' : 
                                (equip.status || 'OK') === 'MAJOR' ? 'warning' : 
                                (equip.status || 'OK') === 'WARNING' ? 'info' : 'success'
                              } 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!site.equipment || site.equipment.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">Aucun équipement à afficher</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {/* Alarms tab */}
            {activeTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Alarmes Actives ({activeAlarms.length})
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
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
                      {paginatedActiveAlarms.map((alarm, index) => (
                        <TableRow key={alarm._id || index}>
                          <TableCell>{alarm.boxId}{alarm.equipment ? ` - ${alarm.equipment}` : ''}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>{getStatusChip(alarm.status)}</TableCell>
                          <TableCell>{formatDate(alarm.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                      {activeAlarms.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">Aucune alarme active à afficher</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination for active alarms */}
                {activeAlarms.length > rowsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    <Pagination 
                      count={Math.ceil(activeAlarms.length / rowsPerPage)} 
                      page={alarmPage} 
                      onChange={handleAlarmPageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
                
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Statistiques des Alarmes
                </Typography>
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={3}>
                        <Typography color="error" variant="subtitle2">Critiques</Typography>
                        <Typography variant="h5">{activeAlarms.filter(a => a.status === 'CRITICAL').length}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography color="warning.main" variant="subtitle2">Majeures</Typography>
                        <Typography variant="h5">{activeAlarms.filter(a => a.status === 'MAJOR').length}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography color="info.main" variant="subtitle2">Warning</Typography>
                        <Typography variant="h5">{activeAlarms.filter(a => a.status === 'WARNING').length}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography color="text.secondary" variant="subtitle2">Total</Typography>
                        <Typography variant="h5">{activeAlarms.length}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            )}
            
            {/* History tab */}
            {activeTab === 3 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Historique des Alarmes ({siteAlarms.length})
                </Typography>
                <TableContainer component={Paper}>
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
                      {paginatedHistoryAlarms.map((alarm, index) => (
                        <TableRow key={alarm._id || index}>
                          <TableCell>{alarm.boxId}{alarm.equipment ? ` - ${alarm.equipment}` : ''}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>{getStatusChip(alarm.status)}</TableCell>
                          <TableCell>{formatDate(alarm.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                      {siteAlarms.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">Aucun historique d'alarme à afficher</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination for history alarms */}
                {siteAlarms.length > rowsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                      count={Math.ceil(siteAlarms.length / rowsPerPage)} 
                      page={historyPage} 
                      onChange={handleHistoryPageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SiteDetail;