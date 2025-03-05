import React, { useState } from 'react';
import { Container, Grid, Paper, Typography, Box, Tabs, Tab, Card, CardContent, Button, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataProvider';
import AlarmTable from './AlarmTable';
import SiteOverview from './SiteOverview';

/**
 * Dashboard component showing an overview of all alarm monitoring data
 */
function Dashboard({ defaultTab = 0 }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { 
    sites, 
    alarms, 
    activeAlarms, 
    last24HoursData, 
    statistics,
    // loading is not currently used directly in render, but kept for future use
    fetchAllData,
    acknowledgeAlarm
  } = useData();
  
  const [refreshing, setRefreshing] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="div">
          Tableau de Bord AlarmManager
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Summary statistics */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="error" gutterBottom>
              Alarmes Critiques
            </Typography>
            <Typography component="p" variant="h4">
              {statistics.critical}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="warning.main" gutterBottom>
              Alarmes Majeures
            </Typography>
            <Typography component="p" variant="h4">
              {statistics.major}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="info.main" gutterBottom>
              Alarmes Warning
            </Typography>
            <Typography component="p" variant="h4">
              {statistics.warning}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="success.main" gutterBottom>
              Sites Surveillés
            </Typography>
            <Typography component="p" variant="h4">
              {sites.length}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Tabs for different views */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Vue d'ensemble" />
                <Tab label="Alarmes Actives" />
                <Tab label="Statistiques" />
                <Tab label="Sites" />
              </Tabs>
            </Box>
            
            {/* Overview tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Activité des Alarmes (Dernières 24 Heures)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={last24HoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="critical" name="Critique" stroke="#ff0000" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="major" name="Majeure" stroke="#ff9800" />
                    <Line type="monotone" dataKey="warning" name="Warning" stroke="#ffeb3b" />
                  </LineChart>
                </ResponsiveContainer>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Alarmes Récentes
                </Typography>
                <AlarmTable alarms={alarms.slice(0, 10)} />
              </Box>
            )}
            
            {/* Active Alarms tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <AlarmTable 
                  alarms={activeAlarms} 
                  showAcknowledge={true}
                  onAcknowledge={acknowledgeAlarm}  
                />
              </Box>
            )}
            
            {/* Statistics tab */}
            {activeTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Distribution des Alarmes par Site
                </Typography>
                <Grid container spacing={3}>
                  {sites.map(site => (
                    <Grid item xs={12} md={4} key={site.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {site.name}
                          </Typography>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={last24HoursData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="critical" name="Critique" stroke="#ff0000" />
                              <Line type="monotone" dataKey="major" name="Majeure" stroke="#ff9800" />
                              <Line type="monotone" dataKey="warning" name="Warning" stroke="#ffeb3b" />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* Sites tab */}
            {activeTab === 3 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {sites.map(site => (
                    <Grid item xs={12} md={6} lg={4} key={site.id}>
                      <SiteOverview site={site} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;