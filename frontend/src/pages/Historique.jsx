// src/pages/Historique.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Link,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // Import your centralized API client

// Import the hooks for alarms and sites
import { useAlarms } from '../hooks/useAlarms';
import { useSites } from '../hooks/useSites';

const Historique = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // States for data
  const [alarms, setAlarms] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for filter
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  // Fetch data using your API client
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        if (!isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          navigate('/login');
          return;
        }
        
        console.log('Starting to fetch data for History page');
        
        // Use your centralized API client
        const alarmsResponse = await api.get('/alarms');
        console.log('Alarms response status:', alarmsResponse.status);
        
        // Determine alarms data structure
        let alarmsData;
        if (alarmsResponse.data.alarms && Array.isArray(alarmsResponse.data.alarms)) {
          alarmsData = alarmsResponse.data.alarms;
        } else if (Array.isArray(alarmsResponse.data)) {
          alarmsData = alarmsResponse.data;
        } else {
          console.error('Unexpected alarms data structure:', alarmsResponse.data);
          setError('Received invalid data format from server');
          setLoading(false);
          return;
        }
        
        setAlarms(alarmsData);
        
        // Fetch sites using the same API client
        try {
          const sitesResponse = await api.get('/sites');
          console.log('Sites response status:', sitesResponse.status);
          setSites(sitesResponse.data);
        } catch (siteError) {
          console.error('Error fetching sites:', siteError);
          // Continue anyway, we can still show alarms
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching alarm data:', err);
        
        if (err.response?.status === 401) {
          console.error('Authentication error details:', err.response?.data);
          setError('Votre session a expiré. Veuillez vous reconnecter.');
          setLoading(false);
        } else {
          setError(`Erreur de chargement des données: ${err.message || 'Unknown error'}`);
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [navigate, isAuthenticated]);

  // Apply filters to alarms
  const getFilteredAlarms = () => {
    return alarms.filter(alarm => {
      // Filter by site
      if (siteFilter && alarm.siteId !== siteFilter) return false;
      
      // Filter by status
      if (statusFilter && alarm.status !== statusFilter) return false;
      
      // Filter by start date
      if (startDate && new Date(alarm.timestamp) < new Date(startDate)) return false;
      
      // Filter by end date
      if (endDate) {
        // Set end of day for end date
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(alarm.timestamp) > endOfDay) return false;
      }
      
      return true;
    });
  };

  // Apply filters
  const handleApplyFilters = () => {
    const filtered = getFilteredAlarms();
    setFilteredData(filtered);
    setIsFiltered(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSiteFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setIsFiltered(false);
    setFilteredData([]);
  };

  // Handle login
  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Retry loading data
  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check authentication status
      if (!isAuthenticated) {
        setError('Not authenticated. Please log in again.');
        setLoading(false);
        navigate('/login');
        return;
      }
      
      // Use your centralized API client
      const alarmsResponse = await api.get('/alarms');
      
      // Determine alarms data structure
      let alarmsData;
      if (alarmsResponse.data.alarms && Array.isArray(alarmsResponse.data.alarms)) {
        alarmsData = alarmsResponse.data.alarms;
      } else if (Array.isArray(alarmsResponse.data)) {
        alarmsData = alarmsResponse.data;
      } else {
        console.error('Unexpected alarms data structure on retry:', alarmsResponse.data);
        setError('Received invalid data format from server');
        setLoading(false);
        return;
      }
      
      setAlarms(alarmsData);
      setLoading(false);
    } catch (err) {
      console.error('Error retrying data fetch:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
      } else {
        setError(`Retry failed: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    }
  };

  // Export as PDF (mock function)
  const handleExportPdf = () => {
    alert('Fonction d\'exportation PDF serait implémentée ici');
  };

  // Status chip renderer
  const renderStatusChip = (status) => {
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

  // Get data to display based on filter status
  const displayData = isFiltered ? filteredData : alarms;

  // Show auth error if detected
  if (error && (error.includes('session') || error.includes('reconnecter'))) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
        
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, maxWidth: '500px' }}>
          <Typography variant="subtitle2">Informations d'authentification:</Typography>
          <Typography variant="body2">
            Utilisateur connecté: {user ? `${user.username} (${user.role})` : 'Aucun'}
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleGoToLogin}
          sx={{ mt: 2 }}
        >
          Se reconnecter
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
        Historique des Alarmes
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Filter Form */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="site-filter-label">Site</InputLabel>
              <Select
                labelId="site-filter-label"
                id="site-filter"
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                label="Site"
                disabled={loading || !!error}
              >
                <MenuItem value="">Tous les sites</MenuItem>
                {sites?.map((site) => (
                  <MenuItem key={site.id || site._id || site.name} value={site.name}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Statut</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Statut"
                disabled={loading || !!error}
              >
                <MenuItem value="">Tous les statuts</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
                <MenuItem value="MAJOR">Major</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="OK">OK</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField 
              fullWidth 
              label="Date de début" 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }} 
              size="small"
              disabled={loading || !!error}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField 
              fullWidth 
              label="Date de fin" 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }} 
              size="small"
              disabled={loading || !!error}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<FilterListIcon />}
                onClick={handleApplyFilters}
                fullWidth
                sx={{ bgcolor: '#1976d2' }}
                disabled={loading || !!error}
              >
                FILTRER
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                fullWidth
                disabled={loading || !!error}
              >
                RÉINITIALISER
              </Button>
            </Box>
          </Grid>
          
          {isFiltered && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  Résultats ({filteredData.length} alarmes)
                </Typography>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleExportPdf}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  disabled={loading || !!error}
                >
                  <PictureAsPdfIcon fontSize="small" />
                  Génération de rapport PDF disponible après filtrage
                </Link>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Alarms Table */}
      <Paper sx={{ borderRadius: 1 }}>
        <TableContainer>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="error">
                      Erreur de chargement des données
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      onClick={handleRetry}
                    >
                      Réessayer
                    </Button>
                  </TableCell>
                </TableRow>
              ) : displayData.length > 0 ? (
                displayData.map((alarm, index) => (
                  <TableRow 
                    key={alarm._id || `alarm-${index}`}
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
                    <TableCell>{renderStatusChip(alarm.status)}</TableCell>
                    <TableCell>
                      {new Date(alarm.timestamp).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric'
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucune alarme trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default Historique;