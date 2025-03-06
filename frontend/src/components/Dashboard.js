import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Grid, Paper, Typography, Box, Tabs, Tab, Card, CardContent, Button, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataProvider';
import { useAuth } from '../context/AuthContext';
import AlarmTable from './AlarmTable';
import SiteOverview from './SiteOverview';

/**
 * Dashboard component showing an overview of all alarm monitoring data
 */
function Dashboard({ defaultTab = 0 }) {
  const location = useLocation(); // Get location for route change detection
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { 
    sites, 
    alarms, 
    activeAlarms, 
    last24HoursData, 
    statistics,
    fetchAllData,
    acknowledgeAlarm,
    loading
  } = useData();
  
  const { currentUser, canAccessSite } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadComplete = useRef(false);
  
  // Re-fetch data only on initial mount or manual refresh
  useEffect(() => {
    // Only fetch on initial mount
    if (!initialLoadComplete.current) {
      console.log("Dashboard: Initial data fetch");
      fetchAllData();
      initialLoadComplete.current = true;
    }
  }, [fetchAllData]); // Remove location.pathname from dependencies
  
  // Filter sites based on user permissions
  const visibleSites = sites.filter(site => {
    console.log("Filtering site:", site.name);
    console.log("Current user:", currentUser);
    
    // If admin or supervisor, show all sites
    if (currentUser?.role === 'administrator' || currentUser?.role === 'supervisor') {
      console.log("User is admin/supervisor, showing site");
      return true;
    }
    
    // For agents, only show sites they have access to
    const hasAccess = currentUser?.sites?.includes(site.name);
    console.log(`Agent access check for ${site.name}: ${hasAccess}`);
    return hasAccess;
  });

  console.log("Total sites:", sites.length);
  console.log("Visible sites:", visibleSites.length);
  console.log("Visible site names:", visibleSites.map(s => s.name));

  // Update statistics to match visible sites
  const [filteredStatistics, setFilteredStatistics] = useState(statistics);
  
  useEffect(() => {
    // If user is agent, recalculate statistics based on visible sites
    if (currentUser?.role === 'agent') {
      const filteredAlarms = alarms.filter(alarm => 
        visibleSites.some(site => alarm.siteId === site.name)
      );
      
      const newStats = {
        critical: filteredAlarms.filter(a => a.status === 'CRITICAL').length,
        major: filteredAlarms.filter(a => a.status === 'MAJOR').length,
        warning: filteredAlarms.filter(a => a.status === 'WARNING').length,
        ok: filteredAlarms.filter(a => a.status === 'OK').length
      };
      
      setFilteredStatistics(newStats);
    } else {
      setFilteredStatistics(statistics);
    }
  }, [statistics, alarms, visibleSites, currentUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };
  
  if (loading && sites.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

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
              {filteredStatistics.critical}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="warning.main" gutterBottom>
              Alarmes Majeures
            </Typography>
            <Typography component="p" variant="h4">
              {filteredStatistics.major}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="info.main" gutterBottom>
              Alarmes Warning
            </Typography>
            <Typography component="p" variant="h4">
              {filteredStatistics.warning}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="success.main" gutterBottom>
              Sites Surveillés
            </Typography>
            <Typography component="p" variant="h4">
              {visibleSites.length}
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
                {/* Filter alarms by accessible sites for agents */}
                <AlarmTable 
                  alarms={
                    currentUser?.role === 'agent' 
                      ? alarms.filter(alarm => 
                          visibleSites.some(site => alarm.siteId === site.name)
                        ).slice(0, 10)
                      : alarms.slice(0, 10)
                  } 
                />
              </Box>
            )}
            
            {/* Active Alarms tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <AlarmTable 
                  alarms={
                    currentUser?.role === 'agent' 
                      ? activeAlarms.filter(alarm => 
                          visibleSites.some(site => alarm.siteId === site.name)
                        )
                      : activeAlarms
                  } 
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
                  {visibleSites.map(site => (
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
                {visibleSites.length > 0 ? (
                  <Grid container spacing={3}>
                    {visibleSites.map(site => (
                      <Grid item xs={12} md={6} lg={4} key={site.id || site._id}>
                        <SiteOverview site={site} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      Aucun site à afficher
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {currentUser?.role === 'agent' ? 
                        "Vous n'avez pas de sites assignés à votre compte." : 
                        "Aucun site n'a été configuré dans le système."}
                    </Typography>
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

export default Dashboard;