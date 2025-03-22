// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSiteSummary } from '../hooks/useSites';
import { useAlarmStatistics, useActiveAlarms } from '../hooks/useAlarms';
import AlarmStatusChart from '../components/alarms/AlarmStatusChart';
import SiteTable from '../components/sites/SiteTable';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import '../styles/dashboard-cards.css'; // Import the dashboard card styles

// Metro Card Component
const MetricCard = ({ title, value, icon, type }) => {
  // Define styles based on type
  const getCardClass = () => {
    switch (type) {
      case 'critical':
        return 'dashboard-card critical-card';
      case 'major':
        return 'dashboard-card major-card';
      case 'warning':
        return 'dashboard-card warning-card';
      case 'success':
        return 'dashboard-card success-card';
      default:
        return 'dashboard-card';
    }
  };

  const getIconClass = () => {
    switch (type) {
      case 'critical':
        return 'icon-container critical-icon';
      case 'major':
        return 'icon-container major-icon';
      case 'warning':
        return 'icon-container warning-icon';
      case 'success':
        return 'icon-container success-icon';
      default:
        return 'icon-container';
    }
  };

  return (
    <Paper className={getCardClass()}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography className="metric-label">{title}</Typography>
          <Box className={getIconClass()}>
            {icon}
          </Box>
        </Box>
        <Typography className="metric-value">{value}</Typography>
      </Box>
    </Paper>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();
  
  // Fetch data using your existing hooks
  const { data: sites, isLoading: isSitesLoading, error: sitesError } = useSiteSummary();
  const { data: alarmStats, isLoading: isStatsLoading, error: statsError } = useAlarmStatistics();
  const { data: activeAlarms, isLoading: isAlarmsLoading, error: alarmsError } = useActiveAlarms();
  
  // Loading and error states
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

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['alarms'] });
    queryClient.invalidateQueries({ queryKey: ['sites'] });
  };

  // Get summary statistics from alarm data
  const stats = React.useMemo(() => {
    if (!alarmStats) return { critical: 0, major: 0, warning: 0, total: 0 };
    const { critical = 0, major = 0, warning = 0 } = alarmStats.summary || {};
    return { 
      critical, 
      major, 
      warning, 
      total: sites?.length || 0,
      boxes: sites?.reduce((sum, site) => sum + (site.boxes?.length || 0), 0) || 0,
      equipment: sites?.reduce((sum, site) => sum + (site.equipment?.length || 0), 0) || 0
    };
  }, [alarmStats, sites]);

  // Format status chip display
  const getStatusChip = (status) => {
    switch (status) {
      case 'CRITICAL':
        return <Chip label="CRITICAL" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />;
      case 'MAJOR':
        return <Chip label="MAJOR" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />;
      case 'WARNING':
        return <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ffeb3b', color: 'black' }} />;
      case 'OK':
        return <Chip label="OK" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />;
      default:
        return <Chip label={status || 'UNKNOWN'} size="small" />;
    }
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

  // Navigate to site details
  const handleSiteClick = (siteId) => {
    navigate(`/SiteDetail/${siteId}`);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
          Tableau de Bord
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Rafraîchir les données">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Status summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Alarmes Critiques" 
            value={stats.critical} 
            icon={<ErrorIcon />} 
            type="critical"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Alarmes Majeures" 
            value={stats.major} 
            icon={<WarningIcon />} 
            type="major"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Alarmes Warning" 
            value={stats.warning} 
            icon={<InfoIcon />} 
            type="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Sites Surveillés" 
            value={stats.total} 
            icon={<CheckCircleIcon />} 
            type="success"
          />
        </Grid>
      </Grid>

      {/* Main content area with tabs */}
      <Paper className="dashboard-card" sx={{ overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          className="dashboard-tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: '#f5f5f5',
          }}
        >
          <Tab label="Vue d'ensemble" />
          <Tab label="Alarmes Actives" />
          <Tab label="Sites" />
          <Tab label="Statistiques" />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 0 }}>
          {/* Overview Tab */}
          {tabValue === 0 && (
            <Box className="dashboard-content">
              <Grid container spacing={3}>
                {/* Alarm activity chart */}
                <Grid item xs={12}>
                  <Paper className="dashboard-card chart-container">
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                      Activité des Alarmes (Dernières 24 Heures)
                    </Typography>
                    {chartData ? (
                      <Box sx={{ height: 300 }}>
                        <AlarmStatusChart data={chartData} height={300} />
                      </Box>
                    ) : (
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        border: '1px dashed #ccc',
                        borderRadius: 1 
                      }}>
                        <Typography color="text.secondary">
                          Données statistiques non disponibles
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Recent alarms table */}
                <Grid item xs={12}>
                  <Paper className="dashboard-card">
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                        Dernières Alarmes
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                              <TableCell>Site</TableCell>
                              <TableCell>Équipement</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell>Statut</TableCell>
                              <TableCell>Horodatage</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeAlarms?.length > 0 ? (
                              activeAlarms.slice(0, 10).map((alarm) => (
                                <TableRow 
                                  key={alarm._id || `${alarm.siteId}-${alarm.equipment}-${alarm.timestamp}`}
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
                                  <TableCell>{getStatusChip(alarm.status)}</TableCell>
                                  <TableCell>
                                    {new Date(alarm.timestamp).toLocaleString('fr-FR', {
                                      year: 'numeric',
                                      month: 'numeric',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: 'numeric'
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <Tooltip title="Voir détails du site">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => handleSiteClick(alarm.siteId.replace(/\s+/g, '-'))}
                                      >
                                        <InfoIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  <Typography variant="body2" color="text.secondary">
                                    Aucune alarme active détectée
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {activeAlarms?.length > 10 && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => setTabValue(1)}
                          >
                            Voir toutes les alarmes ({activeAlarms.length})
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Active Alarms Tab */}
          {tabValue === 1 && (
            <Box className="dashboard-content">
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                    Alarmes Actives ({activeAlarms?.length || 0})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Site</TableCell>
                          <TableCell>Équipement</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Statut</TableCell>
                          <TableCell>Horodatage</TableCell>
                          <TableCell>Acquitté par</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeAlarms?.length > 0 ? (
                          activeAlarms.map((alarm) => (
                            <TableRow 
                              key={alarm._id || `${alarm.siteId}-${alarm.equipment}-${alarm.timestamp}`}
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
                              <TableCell>{getStatusChip(alarm.status)}</TableCell>
                              <TableCell>
                                {new Date(alarm.timestamp).toLocaleString('fr-FR', {
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric'
                                })}
                              </TableCell>
                              <TableCell>
                                {alarm.acknowledgedBy ? (
                                  <Typography variant="body2" color="text.secondary">
                                    {alarm.acknowledgedBy}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="warning.main">
                                    Non acquitté
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip title="Voir détails du site">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleSiteClick(alarm.siteId.replace(/\s+/g, '-'))}
                                  >
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" color="text.secondary">
                                Aucune alarme active détectée
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Sites Tab */}
          {tabValue === 2 && (
            <Box className="dashboard-content">
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                Sites Surveillés ({sites?.length || 0})
              </Typography>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <SiteTable 
                    sites={sites} 
                    isLoading={isSitesLoading} 
                    error={sitesError} 
                  />
                </Box>
              </Paper>
            </Box>
          )}

          {/* Statistics Tab */}
          {tabValue === 3 && (
            <Box className="dashboard-content">
              <Grid container spacing={3}>
                {/* Alarms by type */}
                <Grid item xs={12} md={6}>
                  <Paper className="dashboard-card" sx={{ height: '100%' }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                        Distribution des Alarmes par Type
                      </Typography>
                      {alarmStats?.summary ? (
                        <Box sx={{ p: 2 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Alarmes Critiques
                            </Typography>
                            <Box sx={{ 
                              height: 24, 
                              bgcolor: '#f44336', 
                              width: `${alarmStats.summary.critical / Math.max(alarmStats.summary.critical + alarmStats.summary.major + alarmStats.summary.warning, 1) * 100}%`,
                              minWidth: '30px',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {alarmStats.summary.critical}
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Alarmes Majeures
                            </Typography>
                            <Box sx={{ 
                              height: 24, 
                              bgcolor: '#ff9800', 
                              width: `${alarmStats.summary.major / Math.max(alarmStats.summary.critical + alarmStats.summary.major + alarmStats.summary.warning, 1) * 100}%`,
                              minWidth: '30px',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {alarmStats.summary.major}
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Alarmes Warning
                            </Typography>
                            <Box sx={{ 
                              height: 24, 
                              bgcolor: '#ffeb3b', 
                              width: `${alarmStats.summary.warning / Math.max(alarmStats.summary.critical + alarmStats.summary.major + alarmStats.summary.warning, 1) * 100}%`,
                              minWidth: '30px',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'black',
                              fontWeight: 'bold'
                            }}>
                              {alarmStats.summary.warning}
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          height: 180, 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center' 
                        }}>
                          <Typography color="text.secondary">
                            Aucune donnée disponible
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Acknowledged vs unacknowledged */}
                <Grid item xs={12} md={6}>
                  <Paper className="dashboard-card" sx={{ height: '100%' }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                        État des Alarmes
                      </Typography>
                      {alarmStats?.summary ? (
                        <Box sx={{ p: 2 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Alarmes Acquittées
                            </Typography>
                            <Box sx={{ 
                              height: 24, 
                              bgcolor: '#4caf50', 
                              width: `${alarmStats.summary.acknowledged / Math.max(alarmStats.summary.acknowledged + alarmStats.summary.unacknowledged, 1) * 100}%`,
                              minWidth: '30px',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {alarmStats.summary.acknowledged || 0}
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Alarmes Non Acquittées
                            </Typography>
                            <Box sx={{ 
                              height: 24, 
                              bgcolor: '#f44336', 
                              width: `${alarmStats.summary.unacknowledged / Math.max(alarmStats.summary.acknowledged + alarmStats.summary.unacknowledged, 1) * 100}%`,
                              minWidth: '30px',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {alarmStats.summary.unacknowledged || 0}
                            </Box>
                          </Box>
                          
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Statistiques Totales
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Paper 
                                  elevation={0} 
                                  sx={{ 
                                    p: 1, 
                                    bgcolor: '#f5f5f5', 
                                    textAlign: 'center',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography variant="h5" color="primary">
                                    {stats.boxes}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Boxes
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Paper 
                                  elevation={0} 
                                  sx={{ 
                                    p: 1, 
                                    bgcolor: '#f5f5f5', 
                                    textAlign: 'center',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography variant="h5" color="primary">
                                    {stats.equipment}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Équipements
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          height: 180, 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center' 
                        }}>
                          <Typography color="text.secondary">
                            Aucune donnée disponible
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Alarm trend chart */}
                <Grid item xs={12}>
                  <Paper className="dashboard-card chart-container">
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                      Tendance des Alarmes
                    </Typography>
                    {chartData ? (
                      <Box sx={{ height: 300 }}>
                        <AlarmStatusChart data={chartData} height={300} />
                      </Box>
                    ) : (
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        border: '1px dashed #ccc',
                        borderRadius: 1 
                      }}>
                        <Typography color="text.secondary">
                          Données statistiques non disponibles
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default Dashboard;