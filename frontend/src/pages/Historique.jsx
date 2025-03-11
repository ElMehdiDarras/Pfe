// src/pages/Historique.jsx
import React, { useState } from 'react';
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
import { useAlarms } from '../hooks/useAlarms';
import { useSites } from '../hooks/useSites';

const Historique = () => {
  // States for filter
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  // Fetch data
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: alarms, isLoading: alarmsLoading, refetch } = useAlarms();

  const isLoading = sitesLoading || alarmsLoading;

  // Apply filters and get filtered alarms
  const getFilteredAlarms = () => {
    if (!alarms) return [];
    
    // Make sure alarms is an array before filtering
    const alarmsArray = Array.isArray(alarms) ? alarms : 
                       (alarms.alarms && Array.isArray(alarms.alarms)) ? alarms.alarms : [];
    
    return alarmsArray.filter(alarm => {
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
        return <Chip label={status} size="small" />;
    }
  };

  // Get data to display based on filter status
  const displayData = isFiltered ? filteredData : 
                    (Array.isArray(alarms) ? alarms : 
                    (alarms?.alarms && Array.isArray(alarms.alarms)) ? alarms.alarms : []);

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
        Historique des Alarmes
      </Typography>

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
              >
                <MenuItem value="">Tous les sites</MenuItem>
                {sites?.map((site) => (
                  <MenuItem key={site.id || site._id} value={site.name}>
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
              >
                FILTRER
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                fullWidth
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : displayData.length > 0 ? (
                displayData.map((alarm, index) => (
                  <TableRow 
                    key={alarm.id || alarm._id || index}
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