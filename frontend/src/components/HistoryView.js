import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Grid, Paper, Box, TextField,
  MenuItem, Button, Card, CardContent, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useData } from '../context/DataProvider';

function HistoryView() {
  const { sites, alarms, fetchFilteredAlarms, loading, fetchAllData } = useData();
  
  const [filterSite, setFilterSite] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [filteredAlarms, setFilteredAlarms] = useState([]);
  const [page, setPage] = useState(1);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const rowsPerPage = 20;
  
  // Initialize with current alarms when component mounts
  useEffect(() => {
    if (!hasFiltered && alarms.length > 0) {
      setFilteredAlarms(alarms.slice(0, 100)); // Limit to 100 for performance
    }
  }, [alarms, hasFiltered]);
  
  // Memoized filter function to prevent recreating on every render
  const handleFilter = useCallback(async () => {
    setLocalLoading(true);
    setAutoRefreshEnabled(false); // Disable auto-refresh when filtering
    
    const filters = {
      siteId: filterSite || undefined,
      status: filterStatus || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };
    
    try {
      console.log('Applying filters:', filters);
      const results = await fetchFilteredAlarms(filters);
      console.log('Filter results:', results);
      setFilteredAlarms(results);
      setHasFiltered(true);
      setPage(1); // Reset to first page
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [filterSite, filterStatus, startDate, endDate, fetchFilteredAlarms]);
  
  // Reset filters
  const handleReset = () => {
    setFilterSite('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    setHasFiltered(false);
    setAutoRefreshEnabled(true);
    setFilteredAlarms(alarms.slice(0, 100));
    setPage(1);
  };
  
  const handleExport = () => {
    // Create CSV content
    const headers = ['Site', 'Equipment', 'Description', 'Status', 'Timestamp', 'Acknowledged'];
    const csvRows = [
      headers.join(','),
      ...filteredAlarms.map(alarm => [
        alarm.siteId || '',
        alarm.boxId ? (alarm.equipment ? `${alarm.boxId} - ${alarm.equipment}` : alarm.boxId) : '',
        `"${alarm.description ? alarm.description.replace(/"/g, '""') : ''}"`, // Handle quotes in description
        alarm.status || '',
        alarm.timestamp ? new Date(alarm.timestamp).toLocaleString() : '',
        alarm.acknowledged ? 'Oui' : 'Non'
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    link.href = url;
    link.setAttribute('download', `alarmmanager-history-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  // Get a status chip with appropriate color
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

  // Set up auto-refresh that respects the filter state
  useEffect(() => {
    // Only setup auto-refresh if it's enabled
    if (!autoRefreshEnabled) return;
    
    const refreshInterval = setInterval(() => {
      if (!hasFiltered) {
        console.log('Auto-refreshing alarm data');
        fetchAllData();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled, hasFiltered, fetchAllData]);

  // Paginated data
  const paginatedAlarms = filteredAlarms.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  // Total pages
  const totalPages = Math.ceil(filteredAlarms.length / rowsPerPage);
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="div">
        Historique des Alarmes
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Site"
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">Tous les sites</MenuItem>
              {sites.map(site => (
                <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Statut"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="CRITICAL">Critique</MenuItem>
              <MenuItem value="MAJOR">Majeure</MenuItem>
              <MenuItem value="WARNING">Warning</MenuItem>
              <MenuItem value="OK">OK</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Date de début"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Date de fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
            />
          </Grid>
          <Grid item xs={4} md={1}>
            <Button 
              variant="contained" 
              startIcon={localLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />} 
              fullWidth
              sx={{ height: '56px' }}
              onClick={handleFilter}
              disabled={localLoading}
            >
              Filtrer
            </Button>
          </Grid>
          <Grid item xs={4} md={1}>
            <Button 
              variant="outlined" 
              color="primary"
              fullWidth
              sx={{ height: '56px' }}
              onClick={handleReset}
              disabled={localLoading}
            >
              Réinitialiser
            </Button>
          </Grid>
          <Grid item xs={4} md={1}>
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />} 
              color="secondary"
              fullWidth
              sx={{ height: '56px' }}
              onClick={handleExport}
              disabled={localLoading || filteredAlarms.length === 0}
            >
              Exporter
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Résultats ({filteredAlarms.length} alarmes)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasFiltered ? 
                'Alarmes filtrées selon vos critères' : 
                'Utilisez les filtres ci-dessus pour affiner les résultats'}
            </Typography>
          </Box>
          {loading || localLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Site</TableCell>
                      <TableCell>Équipement</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Horodatage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAlarms.length > 0 ? (
                      paginatedAlarms.map((alarm, index) => (
                        <TableRow key={alarm._id || `alarm-${index}`}>
                          <TableCell>{alarm.siteId}</TableCell>
                          <TableCell>{alarm.boxId}{alarm.equipment ? ` - ${alarm.equipment}` : ''}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>{getStatusChip(alarm.status)}</TableCell>
                          <TableCell>{formatDate(alarm.timestamp)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          {hasFiltered ? 
                            'Aucune alarme ne correspond à vos critères de recherche' : 
                            'Aucune alarme à afficher'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {filteredAlarms.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary" 
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default HistoryView;