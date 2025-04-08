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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useSiteSummary } from '../hooks/useSites';
import { useAlarmStatistics, useActiveAlarms } from '../hooks/useAlarms';
import AlarmStatusChart from '../components/alarms/AlarmStatusChart';
import SiteTable from '../components/sites/SiteTable';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import '../styles/dashboard-cards.css'; // Import the dashboard card styles

// Metric Card Component
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

// Site Status Card Component for Statistics tab
const SiteStatusCard = ({ site }) => {
  const navigate = useNavigate();
  
  // Handle click to navigate to site details
  const handleClick = () => {
    navigate(`/SiteDetail/${site.id || site.name.replace(/\s+/g, '-')}`);
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL':
        return '#f44336';
      case 'MAJOR':
        return '#ff9800';
      case 'WARNING':
        return '#ffeb3b';
      case 'OK':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };
  
  return (
    <Card 
      sx={{ 
        mb: 1, 
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3,
          bgcolor: 'rgba(0, 0, 0, 0.01)'
        },
        borderLeft: `4px solid ${getStatusColor(site.status)}`,
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight="medium">
            {site.name}
          </Typography>
          <Chip 
            label={site.activeAlarms > 0 ? `${site.activeAlarms} alarmes` : 'OK'} 
            size="small"
            sx={{ 
              bgcolor: site.activeAlarms > 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
              color: site.activeAlarms > 0 ? '#d32f2f' : '#2e7d32',
              fontWeight: 'bold'
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {site.location || 'Emplacement non défini'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();
  // Add state for time range selection
  const [timeRange, setTimeRange] = useState('24h');
  
  // Fetch data using your existing hooks, now passing the timeRange
  const { data: sites, isLoading: isSitesLoading, error: sitesError } = useSiteSummary();
  const { data: alarmStats, isLoading: isStatsLoading, error: statsError, refetch: refetchStats } = useAlarmStatistics(timeRange);
  const { data: activeAlarms, isLoading: isAlarmsLoading, error: alarmsError, refetch: refetchAlarms } = useActiveAlarms();
  
  // Loading and error states
  const isLoading = isSitesLoading || isStatsLoading || isAlarmsLoading;
  const hasError = sitesError || statsError || alarmsError;

  // Auto-refresh for live mode
  useEffect(() => {
    let intervalId;
    
    if (timeRange === 'live') {
      // Set up auto-refresh every 10 seconds in live mode
      intervalId = setInterval(() => {
        refetchStats();
        refetchAlarms();
      }, 10000);
    }
    
    // Clean up interval when component unmounts or timeRange changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeRange, refetchStats, refetchAlarms]);

  // Add debugging logs for alarm statistics data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
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
  
  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
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
      equipment: sites?.reduce((sum, site) => sum + (site.equipment?.length || 0), 0) || 0,
      acknowledgedPercentage: Math.round(
        (alarmStats.summary.acknowledged / 
        Math.max(alarmStats.summary.acknowledged + alarmStats.summary.unacknowledged, 1)) * 100
      )
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
    
    // For 24h timeRange
    if (timeRange === '24h' && alarmStats?.timeSeriesData?.hourly && Array.isArray(alarmStats.timeSeriesData.hourly)) {
      return alarmStats.timeSeriesData.hourly.map(item => ({
        hour: `${item.label}h`,
        critical: item.critical || 0,
        major: item.major || 0,
        warning: item.warning || 0
      }));
    }
    
    // For 7d timeRange
    if (timeRange === '7d' && alarmStats?.timeSeriesData?.daily && Array.isArray(alarmStats.timeSeriesData.daily)) {
      return alarmStats.timeSeriesData.daily.map(item => ({
        hour: item.label, // Keep using 'hour' as the key for consistency with the chart component
        critical: item.critical || 0,
        major: item.major || 0,
        warning: item.warning || 0
      }));
    }
    
    // For live timeRange
    if (timeRange === 'live' && alarmStats?.timeSeriesData?.recent && Array.isArray(alarmStats.timeSeriesData.recent)) {
      return alarmStats.timeSeriesData.recent.map(item => ({
        hour: item.label,
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

  // Navigate to alarms history page
  const handleViewAlarmHistory = () => {
    navigate('/Historique');
  };

  // Handle click on sites with alarms
  const handleViewProblemSites = () => {
    setTabValue(2); // Switch to Sites tab
  };

  // Sort sites by active alarms (most alarmed first)
  const sortedSites = React.useMemo(() => {
    if (!sites) return [];
    return [...sites].sort((a, b) => {
      // First sort by whether they have active alarms
      if (a.activeAlarms > 0 && b.activeAlarms === 0) return -1;
      if (a.activeAlarms === 0 && b.activeAlarms > 0) return 1;
      
      // Then by number of active alarms
      if (a.activeAlarms !== b.activeAlarms) {
        return b.activeAlarms - a.activeAlarms;
      }
      
      // Finally alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [sites]);

  // Filter sites with problems for quick view
  const sitesWithAlarms = React.useMemo(() => {
    if (!sortedSites) return [];
    return sortedSites.filter(site => site.activeAlarms > 0);
  }, [sortedSites]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Chargement des données...</Typography>
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 1 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Erreur de chargement des données
        </Typography>
        <Typography color="error.dark" paragraph>
          Une erreur s'est produite lors du chargement des données. Veuillez rafraîchir la page ou réessayer plus tard.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRefresh} 
          startIcon={<RefreshIcon />}
          sx={{ mt: 1 }}
        >
          Rafraîchir
        </Button>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2, pt: 2 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                        Activité des Alarmes {
                          timeRange === '24h' ? '(Dernières 24 Heures)' : 
                          timeRange === '7d' ? '(7 Jours)' : 
                          '(Temps Réel)'
                        }
                      </Typography>
                      
                      {/* Add the dropdown for time range selection */}
                      <FormControl sx={{ minWidth: 150 }} size="small">
                        <InputLabel id="time-range-label">Période</InputLabel>
                        <Select
                          labelId="time-range-label"
                          id="time-range-select"
                          value={timeRange}
                          label="Période"
                          onChange={handleTimeRangeChange}
                        >
                          <MenuItem value="24h">24 heures</MenuItem>
                          <MenuItem value="7d">7 jours</MenuItem>
                          <MenuItem value="live">Temps réel</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    
                    {chartData ? (
                      <Box sx={{ height: 300, px: 2, pb: 2 }}>
                        <AlarmStatusChart data={chartData} height={300} />
                      </Box>
                    ) : (
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        border: '1px dashed #ccc',
                        borderRadius: 1,
                        mx: 2,
                        mb: 2
                      }}>
                        <Typography color="text.secondary">
                          Données statistiques non disponibles
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Additional info for real-time mode */}
                    {timeRange === 'live' && (
                      <Box sx={{ mt: 2, p: 2, mx: 2, mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1, border: '1px solid rgba(25, 118, 210, 0.1)' }}>
                        <Typography variant="body2" color="text.secondary">
                          Mode Temps Réel - Les données sont actualisées toutes les 10 secondes.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Site status cards - Sites with active alarms */}
                {sitesWithAlarms.length > 0 && (
                  <Grid item xs={12} md={4}>
                    <Paper className="dashboard-card">
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                            Sites avec Alarmes ({sitesWithAlarms.length})
                          </Typography>
                          <Button 
                            variant="text" 
                            size="small"
                            onClick={handleViewProblemSites}
                            endIcon={<VisibilityIcon fontSize="small" />}
                          >
                            Tout voir
                          </Button>
                        </Box>
                        
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                          {sitesWithAlarms.slice(0, 5).map(site => (
                            <SiteStatusCard key={site.id || site.name} site={site} />
                          ))}
                          
                          {sitesWithAlarms.length > 5 && (
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                              <Button 
                                variant="outlined" 
                                size="small"
                                onClick={handleViewProblemSites}
                              >
                                +{sitesWithAlarms.length - 5} autres sites
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* Recent alarms table */}
                <Grid item xs={12} md={sitesWithAlarms.length > 0 ? 8 : 12}>
                  <Paper className="dashboard-card">
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                          Dernières Alarmes
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={handleViewAlarmHistory}
                        >
                          Voir l'historique
                        </Button>
                      </Box>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                      Alarmes Actives ({activeAlarms?.length || 0})
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={handleViewAlarmHistory}
                    >
                      Voir l'historique
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Site</TableCell>
                          <TableCell>Équipement</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Statut</TableCell>
                          <TableCell>Horodatage</TableCell>
                          <TableCell>Detail</TableCell>
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
                </Box>
              </Paper>
            </Box>
          )}

          {/* Sites Tab */}
          {tabValue === 2 && (
            <Box className="dashboard-content">
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'medium', p: 2 }}>
                Sites Surveillés ({sites?.length || 0})
              </Typography>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <SiteTable 
                    sites={sites} 
                    isLoading={isSitesLoading} 
                    error={sitesError} 
                    onSiteClick={handleSiteClick}
                  />
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default Dashboard;