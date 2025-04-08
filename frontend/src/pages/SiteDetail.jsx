// src/pages/SiteDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useSiteById } from '../hooks/useSites';
import { useAlarmsBySite } from '../hooks/useAlarms';
import AlarmTable from '../components/alarms/AlarmTable';
import AlarmStatusChart from '../components/alarms/AlarmStatusChart';
import EquipmentStatusList from '../components/sites/EquipmentStatusList';
import BoxStatusList from '../components/sites/BoxStatusList';
import api from '../api/axios';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`site-tabpanel-${index}`}
      aria-labelledby={`site-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SiteDetail = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  // History tab state
  const [historyFilter, setHistoryFilter] = useState({
    status: '',
    startDate: '',
    endDate: '',
    equipment: ''
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryError, setIsHistoryError] = useState(null);
  const [historyAlarms, setHistoryAlarms] = useState([]);
  const [filteredHistoryAlarms, setFilteredHistoryAlarms] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  
  // Fetch site data
  const {
    data: site,
    isLoading: siteLoading,
    error: siteError
  } = useSiteById(siteId);
  
  // Fetch alarms for this site
  const {
    data: alarms,
    isLoading: alarmsLoading,
    error: alarmsError
  } = useAlarmsBySite(siteId);

  // Add this useEffect to load history data when the site changes or tab changes to history
  useEffect(() => {
    // Only fetch history data when on the history tab
    if (tabValue === 4 && siteId) {
      fetchHistoryAlarms();
    }
  }, [siteId, tabValue]);

  // Function to fetch history alarms
  // Function to fetch history alarms with better error handling
// Function to fetch history alarms with better error handling
const fetchHistoryAlarms = async (page = 1, append = false) => {
  try {
    setIsHistoryLoading(true);
    setIsHistoryError(null);
    
    // Normalize the site ID if it contains hyphens
    const normalizedSiteId = siteId.replace(/-/g, ' ');
    
    // Build query params
    const params = {
      page,
      limit: 50
    };
    
    if (historyFilter.status) params.status = historyFilter.status;
    if (historyFilter.startDate) params.startDate = historyFilter.startDate;
    if (historyFilter.endDate) params.endDate = historyFilter.endDate;
    if (historyFilter.equipment) params.equipment = historyFilter.equipment;
    
    try {
      // Try to use the alarms endpoint with filtering
      const response = await api.get(`/alarms/site/${normalizedSiteId}`, { params });
      
      // Process results
      if (response.data) {
        const alarmData = Array.isArray(response.data) ? response.data : 
                         (response.data.alarms ? response.data.alarms : []);
                         
        const newAlarms = alarmData.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        if (append) {
          setHistoryAlarms(prev => [...prev, ...newAlarms]);
          setFilteredHistoryAlarms(prev => [...prev, ...newAlarms]);
        } else {
          setHistoryAlarms(newAlarms);
          setFilteredHistoryAlarms(newAlarms);
        }
        
        // Check pagination if it exists
        const pagination = response.data.pagination;
        setHasMoreHistory(pagination && pagination.page < pagination.pages);
        setHistoryPage(pagination ? pagination.page : 1);
      } else {
        if (!append) {
          setHistoryAlarms([]);
          setFilteredHistoryAlarms([]);
        }
        setHasMoreHistory(false);
      }
    } catch (apiError) {
      console.error('API error:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching history alarms:', error);
    setIsHistoryError(error);
    
    if (!append) {
      setHistoryAlarms([]);
      setFilteredHistoryAlarms([]);
    }
  } finally {
    setIsHistoryLoading(false);
  }
};

  // Function to apply history filters
  const applyHistoryFilter = () => {
    // Reset page when applying new filters
    setHistoryPage(1);
    fetchHistoryAlarms(1, false);
  };

  // Function to reset history filters
  const resetHistoryFilter = () => {
    setHistoryFilter({
      status: '',
      startDate: '',
      endDate: '',
      equipment: ''
    });
    
    // Reset page and fetch all alarms
    setHistoryPage(1);
    
    // Use timeout to ensure state is updated before fetching
    setTimeout(() => {
      fetchHistoryAlarms(1, false);
    }, 0);
  };

  // Function to load more history alarms
  const loadMoreHistory = () => {
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    fetchHistoryAlarms(nextPage, true);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Render status chip
  const renderStatusChip = (status) => {
    if (!status) return null;
    
    status = status.toUpperCase();
    return (
      <Chip
        label={status}
        size="small"
        className={`status-chip ${status.toLowerCase()}-chip`}
      />
    );
  };

  // Loading state
  if (siteLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (siteError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erreur lors du chargement des détails du site: {siteError.message}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          Retour
        </Button>
      </Box>
    );
  }
  
  // If no site data
  if (!site) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Aucune donnée trouvée pour ce site
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          Retour
        </Button>
      </Box>
    );
  }
  
  return (
    <div className="content-wrapper">
      {/* Site header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography variant="h4" className="page-title">{site.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Site Type {site.type || 2} | VLAN: {site.vlan || '000'} | {site.location}
          </Typography>
        </div>
        
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          variant="outlined"
        >
          Retour
        </Button>
      </Box>
      
      {/* Tabs navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          className="dashboard-tabs"
        >
          <Tab label="VUE D'ENSEMBLE" />
          <Tab label="EQUIPEMENTS" />
          <Tab label="ALARMES" />
          <Tab label="ARCHITECTURE" />
          <Tab label="HISTORIQUE" />
        </Tabs>
      </Box>
      
      {/* Tab panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Site details card */}
          <Grid item xs={12} md={6}>
            <Paper className="card">
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Détails du Site</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ width: '40%', fontWeight: 'medium' }}>Nom</TableCell>
                      <TableCell>{site.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'medium' }}>VLAN</TableCell>
                      <TableCell>{site.vlan || '000'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'medium' }}>Plage IP</TableCell>
                      <TableCell>{site.ipRange}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'medium' }}>Emplacement</TableCell>
                      <TableCell>{site.location}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'medium' }}>Statut</TableCell>
                      <TableCell>{renderStatusChip(site.status || 'OK')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'medium' }}>Nombre de Boxes</TableCell>
                      <TableCell>{site.boxes?.length || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'medium' }}>Nombre d'Équipements</TableCell>
                      <TableCell>{site.equipment?.length || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          {/* Alarm activity chart */}
          <Grid item xs={12} md={6}>
            <Paper className="card">
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Activité des Alarmes</Typography>
              </Box>
              <Box sx={{ height: 300, p: 2 }}>
                {alarmsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : alarmsError ? (
                  <Alert severity="error">
                    Erreur lors du chargement des données d'alarmes
                  </Alert>
                ) : (
                  <AlarmStatusChart
                    data={[
                      // Sample data
                      { hour: '0h', critical: 0, major: 0, warning: 0 },
                      { hour: '1h', critical: 0, major: 0, warning: 2 },
                      { hour: '2h', critical: 2, major: 2, warning: 0 },
                    ]}
                    height={250}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Box status */}
          <Grid item xs={12}>
            <Paper className="card">
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Status des Box</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {site.boxes && site.boxes.length > 0 ? (
                  <BoxStatusList boxes={site.boxes} />
                ) : (
                  <Alert severity="info">Pas de box configurée pour ce site</Alert>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Equipment status */}
          <Grid item xs={12}>
            <Paper className="card">
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Status des Équipements</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {site.equipment && site.equipment.length > 0 ? (
                  <EquipmentStatusList equipment={site.equipment} />
                ) : (
                  <Alert severity="info">Pas d'équipement configuré pour ce site</Alert>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Paper className="card">
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Dernières Alarmes</Typography>
          </Box>
          <Box sx={{ p: 0 }}>
            {alarmsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : alarmsError ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="error">
                  Erreur lors du chargement des alarmes: {alarmsError.message}
                </Alert>
              </Box>
            ) : (
              <AlarmTable
                alarms={alarms || []}
                showAcknowledgeButton
              />
            )}
          </Box>
        </Paper>
      </TabPanel>
      
{/* Architecture tab */}
<TabPanel value={tabValue} index={3}>
  <Paper className="card">
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="h6">Architecture du Site</Typography>
    </Box>
    <Box sx={{ p: 3, textAlign: 'center' }}>
      {/* Architecture image from public folder */}
      <Box sx={{
        width: '100%',
        height: 400,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2
      }}>
        {site?.name ? (
          <img 
            src={`/architecturesite/${site.name.replace(/\s+/g, '-')}.png`} 
            alt={`Architecture de ${site.name}`}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain' 
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/architecturesite/default-architecture.png';
            }}
          />
        ) : (
          <Typography color="text.secondary">
            Architecture diagram will be displayed here
          </Typography>
        )}
      </Box>
      <Divider sx={{ my: 3 }} />
      <Typography variant="body1" align="left" paragraph>
        Ce diagramme représente l'architecture complète du site {site?.name}, montrant tous les composants et leurs interconnexions.
      </Typography>
      <Typography variant="body2" align="left">
        Les équipements principaux incluent:
      </Typography>
      <ul style={{ textAlign: 'left' }}>
        <li>Box de supervision</li>
        <li>Climatiseurs de précision</li>
        <li>Capteurs de température</li>
        <li>Armoires électriques</li>
        <li>Systèmes de protection incendie</li>
      </ul>
    </Box>
  </Paper>
</TabPanel>
      
      {/* History tab */}
      <TabPanel value={tabValue} index={4}>
        <Paper className="card">
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Historique des Alarmes</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {/* Filter section */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="Statut"
                  fullWidth
                  size="small"
                  value={historyFilter.status}
                  onChange={(e) => setHistoryFilter({...historyFilter, status: e.target.value})}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="CRITICAL">Critique</MenuItem>
                  <MenuItem value="MAJOR">Majeur</MenuItem>
                  <MenuItem value="WARNING">Avertissement</MenuItem>
                  <MenuItem value="OK">Normal</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Date de début"
                  type="date"
                  fullWidth
                  size="small"
                  value={historyFilter.startDate}
                  onChange={(e) => setHistoryFilter({...historyFilter, startDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Date de fin"
                  type="date"
                  fullWidth
                  size="small"
                  value={historyFilter.endDate}
                  onChange={(e) => setHistoryFilter({...historyFilter, endDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<FilterListIcon />}
                    onClick={applyHistoryFilter}
                    fullWidth
                  >
                    Filtrer
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetHistoryFilter}
                    fullWidth
                  >
                    Réinitialiser
                  </Button>
                </Box>
              </Grid>
            </Grid>
            
            {/* Alarms table */}
            {isHistoryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : isHistoryError ? (
              <Alert severity="error">
                Erreur lors du chargement de l'historique: {isHistoryError.message}
              </Alert>
            ) : filteredHistoryAlarms.length === 0 ? (
              <Alert severity="info">
                Aucune donnée d'historique trouvée pour les critères sélectionnés
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date/Heure</TableCell>
                      <TableCell>Équipement</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredHistoryAlarms.map((alarm) => (
                      <TableRow key={alarm._id}>
                        <TableCell>
                          {new Date(alarm.timestamp).toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell>{alarm.equipment}</TableCell>
                        <TableCell>{alarm.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={alarm.status}
                            size="small"
                            sx={{
                              backgroundColor:
                                alarm.status === 'CRITICAL' ? '#f44336' :
                                alarm.status === 'MAJOR' ? '#ff9800' :
                                alarm.status === 'WARNING' ? '#ffeb3b' :
                                '#4caf50',
                              color:
                                alarm.status === 'WARNING' ? 'black' : 'white'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {/* Load more button if there are more alarms */}
            {hasMoreHistory && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={loadMoreHistory}
                  disabled={isHistoryLoading}
                >
                  {isHistoryLoading ? <CircularProgress size={24} /> : 'Charger plus'}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </TabPanel>
    </div>
  );
};

export default SiteDetail;