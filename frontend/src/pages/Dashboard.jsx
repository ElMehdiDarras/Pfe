// Modified Dashboard.jsx - Fix for Sites tab
import React, { useState } from 'react';
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
import SiteTable from '../components/sites/SiteTable'; // Import the new component

// Dashboard component
const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const { data: sites, isLoading: isSitesLoading, error: sitesError } = useSiteSummary();
  const { data: alarmStats, isLoading: isStatsLoading, error: statsError } = useAlarmStatistics();
  const { data: activeAlarms, isLoading: isAlarmsLoading, error: alarmsError } = useActiveAlarms();
  
  const isLoading = isSitesLoading || isStatsLoading || isAlarmsLoading;
  const hasError = sitesError || statsError || alarmsError;

  // Stats summary from alarm data
  const stats = React.useMemo(() => {
    if (!alarmStats) return { critical: 0, major: 0, warning: 0, total: 0 };
    const { critical, major, warning } = alarmStats.summary;
    return { critical, major, warning, total: sites?.length || 0 };
  }, [alarmStats, sites]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      </Box>
    );
  }

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
              {alarmStats?.last24Hours && (
                <Box sx={{ height: 300, mb: 3 }}>
                  <AlarmStatusChart 
                    data={alarmStats.last24Hours.map(item => ({
                      ...item,
                      hour: `${item.hour}h`
                    }))} 
                    height={300} 
                  />
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
                          key={alarm.id}
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
                          key={alarm.id}
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
              {alarmStats?.last24Hours && (
                <Box sx={{ height: 300, mb: 3 }}>
                  <AlarmStatusChart 
                    data={alarmStats.last24Hours.map(item => ({
                      ...item,
                      hour: `${item.hour}h`
                    }))} 
                    height={300} 
                  />
                </Box>
              )}
            </Box>
          )}
          
          {/* Sites Tab - Fixed implementation */}
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