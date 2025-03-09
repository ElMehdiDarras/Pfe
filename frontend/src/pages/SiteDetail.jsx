// src/pages/SiteDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useSiteById } from '../hooks/useSites';
import { useAlarmsBySite } from '../hooks/useAlarms';
import AlarmStatusChart from '../components/alarms/AlarmStatusChart';

const SiteDetail = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch site data and alarms
  const { 
    data: site, 
    isLoading: siteLoading, 
    error: siteError
  } = useSiteById(siteId);
  
  const { 
    data: alarms, 
    isLoading: alarmsLoading, 
    error: alarmsError
  } = useAlarmsBySite(siteId);

  const isLoading = siteLoading || alarmsLoading;
  const hasError = siteError || alarmsError;

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Create status chips
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
        return <Chip label={status} size="small" />;
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Display error state
  if (hasError || !site) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Erreur de chargement des données du site
      </Alert>
    );
  }

  // Prepare alarms data for chart
  const alarmChartData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    critical: Math.floor(Math.random() * 4),  // Mock data - replace with real data
    major: Math.floor(Math.random() * 4),     // Mock data - replace with real data
    warning: Math.floor(Math.random() * 4)    // Mock data - replace with real data
  }));

  // Get site type based on name
  const getSiteType = (siteName) => {
    if (siteName.includes('Rabat')) return 'Type 1';
    return 'Type 2';
  };

  // Get site VLAN
  const getSiteVlan = (siteName) => {
    if (siteName.includes('Rabat-Hay NAHDA')) return '610';
    if (siteName.includes('Rabat-Soekarno')) return '620';
    if (siteName.includes('Casa-Nations Unies')) return '630';
    return '000';
  };

  return (
    <>
      {/* Site header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium', fontSize: '2rem' }}>
        {site.name}
      </Typography>
      
      <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary' }}>
        Site {getSiteType(site.name)} | VLAN: {getSiteVlan(site.name)} | {site.location}
      </Typography>

      {/* Tab navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="VUE D'ENSEMBLE" />
          <Tab label="EQUIPEMENTS" />
          <Tab label="ALARMES" />
          <Tab label="HISTORIQUE" />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box>
        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Site details section */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 0, mb: 3, borderRadius: 1 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
                    Détails du Site
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            width: '30%', 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'medium'
                          }}
                        >
                          Nom
                        </TableCell>
                        <TableCell>{site.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'medium'
                          }}
                        >
                          VLAN
                        </TableCell>
                        <TableCell>{getSiteVlan(site.name)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'medium'
                          }}
                        >
                          Plage IP
                        </TableCell>
                        <TableCell>{site.ipRange}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'medium'
                          }}
                        >
                          Emplacement
                        </TableCell>
                        <TableCell>{site.location}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'medium'
                          }}
                        >
                          Statut
                        </TableCell>
                        <TableCell>{getStatusChip(site.status)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'medium'
                          }}
                        >
                          Nombre de Boxes
                        </TableCell>
                        <TableCell>{site.boxes?.length || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'medium'
                          }}
                        >
                          Nombre d'Équipements
                        </TableCell>
                        <TableCell>{site.equipment?.length || 0}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            {/* Alarm activity section */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 0, mb: 3, borderRadius: 1 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
                    Activité des Alarmes
                  </Typography>
                </Box>
                <Box sx={{ p: 2, height: 300 }}>
                  <AlarmStatusChart data={alarmChartData} height={280} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Recent Alarms Section */}
        <Paper sx={{ p: 0, borderRadius: 1 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
              Dernières Alarmes
            </Typography>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {alarms && alarms.slice(0, 5).map((alarm) => (
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
                    <TableCell>{site.name}</TableCell>
                    <TableCell>{alarm.equipment}</TableCell>
                    <TableCell>{alarm.description}</TableCell>
                    <TableCell>{getStatusChip(alarm.status)}</TableCell>
                    <TableCell>
                      {new Date(alarm.timestamp).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                {(!alarms || alarms.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Aucune alarme disponible
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Equipment Tab */}
        {tabValue === 1 && (
          <Paper sx={{ p: 0, borderRadius: 1 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
                Équipements
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Box ID</TableCell>
                    <TableCell>Pin ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {site.equipment && site.equipment.map((equip) => (
                    <TableRow key={equip.id}>
                      <TableCell>{equip.name}</TableCell>
                      <TableCell>{equip.type}</TableCell>
                      <TableCell>{getStatusChip(equip.status)}</TableCell>
                      <TableCell>{equip.boxId}</TableCell>
                      <TableCell>{equip.pinId}</TableCell>
                    </TableRow>
                  ))}
                  {(!site.equipment || site.equipment.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Aucun équipement disponible
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Other tabs would be implemented similarly */}
      </Box>
    </>
  );
};

export default SiteDetail;