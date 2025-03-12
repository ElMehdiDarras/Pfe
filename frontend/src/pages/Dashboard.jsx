// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Typography,
  Grid,
  Paper, 
  Box, 
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress 
} from '@mui/material';
import { useSiteSummary } from '../hooks/useSites';
import { useAlarmStatistics, useActiveAlarms } from '../hooks/useAlarms';
import AlarmStatusChart from '../components/alarms/AlarmStatusChart';
import SiteTable from '../components/sites/SiteTable';

// Dashboard component
const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const { data: sites, isLoading: isSitesLoading, error: sitesError } = useSiteSummary();
  const { data: alarmStats, isLoading: isStatsLoading, error: statsError } = useAlarmStatistics();
  const { data: activeAlarms, isLoading: isAlarmsLoading, error: alarmsError } = useActiveAlarms();
  
  const isLoading = isSitesLoading || isStatsLoading || isAlarmsLoading;
  const hasError = sitesError || statsError || alarmsError;

  // Add debugging logs for alarm statistics data
  useEffect(() => {
    console.log('Alarm statistics loaded:', alarmStats);
    if (alarmStats) {
      console.log('Statistics summary:', alarmStats.summary);
      console.log('Time series data:', alarmStats.timeSeriesData);
      
      if (alarmStats.timeSeriesData) {
        console.log('Hourly data available:', !!alarmStats.timeSeriesData.hourly);
        console.log('Recent data available:', !!alarmStats.timeSeriesData.recent);
        
        if (alarmStats.timeSeriesData.hourly) {
          console.log('Hourly data example:', alarmStats.timeSeriesData.hourly[0]);
        }
      }
    }
  }, [alarmStats]);

  // Stats summary from alarm data
  const stats = React.useMemo(() => {
    if (!alarmStats) return { critical: 0, major: 0, warning: 0, total: 0 };
    const { critical, major, warning } = alarmStats.summary;
    return { critical, major, warning, total: sites?.length || 0 };
  }, [alarmStats, sites]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Function to prepare and transform chart data
  const prepareChartData = () => {
    // Check for last24Hours property (added by our transformation)
    if (alarmStats?.last24Hours && Array.isArray(alarmStats.last24Hours)) {
      return alarmStats.last24Hours.map(item => ({
        ...item,
        hour: `${item.hour}h` // Make sure 'hour' is the key used for x-axis
      }));
    }
    
    // Fallback: transform hourly data if available
    if (alarmStats?.timeSeriesData?.hourly && Array.isArray(alarmStats.timeSeriesData.hourly)) {
      return alarmStats.timeSeriesData.hourly.map(item => ({
        hour: `${item.label}h`,
        critical: item.critical || 0,
        major: item.major || 0,
        warning: item.warning || 0
      }));
    }
    
    // No valid data found
    return null;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 1 }}>
        <Typography color="error">
          Erreur de chargement des données. Veuillez rafraîchir la page.
        </Typography>
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2 }}>
            {sitesError && <Typography variant="caption" display="block">Sites error: {sitesError.message}</Typography>}
            {statsError && <Typography variant="caption" display="block">Stats error: {statsError.message}</Typography>}
            {alarmsError && <Typography variant="caption" display="block">Alarms error: {alarmsError.message}</Typography>}
          </Box>
        )}
      </Box>
    );
  }

  // Prepare chart data
  const chartData = prepareChartData();

  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium', mb: 3 }}>
        Tableau de Bord AlarmManager
      </Typography>

      {/* Status summary cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0',
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle1" sx={{ color: '#f44336', mb: 1 }}>
              Alarmes Critiques
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
              {stats.critical}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0',
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle1" sx={{ color: '#ff9800', mb: 1 }}>
              Alarmes Majeures
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
              {stats.major}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0',
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle1" sx={{ color: '#ffeb3b', mb: 1 }}>
              Alarmes Warning
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
              {stats.warning}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0',
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle1" sx={{ color: '#4caf50', mb: 1 }}>
              Sites Surveillés
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
              {stats.total}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs bar */}
      <Paper sx={{ mb: 3, borderRadius: 1 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            '& .MuiTabs-indicator': {
              backgroundColor: '#1976d2',
            }
          }}
        >
          <Tab label="VUE D'ENSEMBLE" />
          <Tab label="ALARMES ACTIVES" />
          <Tab label="STATISTIQUES" />
          <Tab label="SITES" />
        </Tabs>

        <Box sx={{ p: 0 }}>
          {/* Overview Tab Content */}
          {tabValue === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'normal', fontSize: '1rem' }}>
                Activité des Alarmes (Dernières 24 Heures)
              </Typography>
              
              {/* Chart with error handling */}
              {chartData ? (
                <Box sx={{ height: 300, mb: 3 }}>
                  <AlarmStatusChart 
                    data={chartData} 
                    height={300} 
                  />
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    height: 300, 
                    mb: 3, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    border: '1px dashed #ccc',
                    borderRadius: 1
                  }}
                >
                  <Typography color="text.secondary">
                    Données statistiques non disponibles
                  </Typography>
                </Box>
              )}

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'normal', fontSize: '1rem' }}>
                Alarmes Récentes
              </Typography>
              {activeAlarms && (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Site</TableCell>
                        <TableCell>Équipement</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Horodatage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeAlarms.slice(0, 10).map((alarm) => (
                        <TableRow 
                          key={alarm._id || alarm.id}
                          sx={{ 
                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                            backgroundColor: alarm.status === 'CRITICAL' 
                              ? 'rgba(244, 67, 54, 0.05)' 
                              : alarm.status === 'MAJOR' 
                                ? 'rgba(255, 152, 0, 0.05)' 
                                : 'inherit'
                          }}
                        >
                          <TableCell>{alarm.siteId}</TableCell>
                          <TableCell>{alarm.equipment}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>
                            {alarm.status === 'CRITICAL' ? (
                              <Chip label="CRITICAL" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />
                            ) : alarm.status === 'MAJOR' ? (
                              <Chip label="MAJOR" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
                            ) : alarm.status === 'WARNING' ? (
                              <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ffeb3b', color: 'black' }} />
                            ) : (
                              <Chip label="OK" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
                            )}
                          </TableCell>
                          <TableCell>{new Date(alarm.timestamp).toLocaleString('fr-FR')}</TableCell>
                        </TableRow>
                      ))}
                      {(!activeAlarms || activeAlarms.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            Aucune alarme active
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Active Alarms Tab */}
          {tabValue === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'normal', fontSize: '1rem' }}>
                Alarmes Actives
              </Typography>
              {activeAlarms && (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Site</TableCell>
                        <TableCell>Équipement</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Horodatage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeAlarms.map((alarm) => (
                        <TableRow 
                          key={alarm._id || alarm.id}
                          sx={{ 
                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                            backgroundColor: alarm.status === 'CRITICAL' 
                              ? 'rgba(244, 67, 54, 0.05)' 
                              : alarm.status === 'MAJOR' 
                                ? 'rgba(255, 152, 0, 0.05)' 
                                : 'inherit'
                          }}
                        >
                          <TableCell>{alarm.siteId}</TableCell>
                          <TableCell>{alarm.equipment}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>
                            {alarm.status === 'CRITICAL' ? (
                              <Chip label="CRITICAL" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />
                            ) : alarm.status === 'MAJOR' ? (
                              <Chip label="MAJOR" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
                            ) : alarm.status === 'WARNING' ? (
                              <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ffeb3b', color: 'black' }} />
                            ) : (
                              <Chip label="OK" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
                            )}
                          </TableCell>
                          <TableCell>{new Date(alarm.timestamp).toLocaleString('fr-FR')}</TableCell>
                        </TableRow>
                      ))}
                      {(!activeAlarms || activeAlarms.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            Aucune alarme active
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
          
          {/* Statistics Tab */}
          {tabValue === 2 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'normal', fontSize: '1rem' }}>
                Statistiques des Alarmes
              </Typography>
              
              {/* Chart with error handling */}
              {chartData ? (
                <Box sx={{ height: 300, mb: 3 }}>
                  <AlarmStatusChart 
                    data={chartData} 
                    height={300} 
                  />
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    height: 300, 
                    mb: 3, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    border: '1px dashed #ccc',
                    borderRadius: 1
                  }}
                >
                  <Typography color="text.secondary">
                    Données statistiques non disponibles
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          {/* Sites Tab */}
          {tabValue === 3 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'normal', fontSize: '1rem' }}>
                Liste des sites
              </Typography>
              <SiteTable 
                sites={sites} 
                isLoading={isSitesLoading} 
                error={sitesError} 
              />
            </Box>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default Dashboard;