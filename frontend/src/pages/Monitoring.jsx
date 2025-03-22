// src/pages/Monitoring.jsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import { useActiveAlarms } from '../hooks/useAlarms';
import { useSites } from '../hooks/useSites';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard-cards.css'; // Import the shared card styles

const Monitoring = () => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  
  // Query client for manual refresh
  const queryClient = useQueryClient();
  
  // Get data
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: activeAlarms, isLoading: alarmsLoading } = useActiveAlarms();
  
  // Check if any loading is in progress
  const isLoading = sitesLoading || alarmsLoading;
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['alarms'] });
    queryClient.invalidateQueries({ queryKey: ['sites'] });
  };

  // Navigate to site detail
  const handleSiteClick = (siteId) => {
    navigate(`/SiteDetail/${siteId}`);
  };

  // Function to render status chip
  const renderStatusChip = (status) => {
    switch (status) {
      case 'UP':
        return <Chip label="UP" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />;
      case 'WARNING':
        return <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />;
      case 'DOWN':
        return <Chip label="DOWN" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />;
      case 'CRITICAL':
        return <Chip label="CRITICAL" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />;
      case 'MAJOR':
        return <Chip label="MAJOR" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />;
      case 'OK':
        return <Chip label="OK" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>Monitoring</Typography>
        
        <Tooltip title="Rafraîchir">
          <IconButton onClick={handleRefresh} sx={{ color: '#FF5722' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Paper className="dashboard-card" sx={{ overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          className="dashboard-tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: '#f5f5f5',
          }}
        >
          <Tab label="HOSTS" />
          <Tab label="BOXES" />
          <Tab label="EQUIPEMENTS" />
          <Tab label="PROBLÈMES" />
        </Tabs>
        
        <Box className="dashboard-content">
          {/* Hosts Tab */}
          {tabValue === 0 && (
            <TableContainer component={Paper} className="dashboard-card" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Host</TableCell>
                    <TableCell>Adresse IP</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Dernière vérification</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : sites && sites.length > 0 ? (
                    sites.map((site) => (
                      <TableRow 
                        key={site.id}
                        hover
                        onClick={() => handleSiteClick(site.id)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                        }}
                      >
                        <TableCell>{site.name}</TableCell>
                        <TableCell>{site.ipRange?.split('/')[0]}</TableCell>
                        <TableCell>
                          {site.activeAlarms > 0 ? (
                            <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
                          ) : (
                            <Chip label="UP" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
                          )}
                        </TableCell>
                        <TableCell>{site.location}</TableCell>
                        <TableCell>{new Date().toLocaleString('fr-FR')}</TableCell>
                        <TableCell>
                          {site.activeAlarms > 0 ? 'Présence d\'alarmes' : 'Host répondant normalement'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Aucun host trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Boxes Tab */}
          {tabValue === 1 && (
            <TableContainer component={Paper} className="dashboard-card" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Box</TableCell>
                    <TableCell>Adresse IP</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Dernière vérification</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : sites ? (
                    sites.flatMap((site) => 
                      (site.boxes || []).map((box) => (
                        <TableRow 
                          key={box.id}
                          hover
                          sx={{ 
                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                          }}
                        >
                          <TableCell>{box.name}</TableCell>
                          <TableCell>{box.ip}</TableCell>
                          <TableCell>{renderStatusChip(box.status)}</TableCell>
                          <TableCell>{site.name}</TableCell>
                          <TableCell>{new Date(box.lastSeen).toLocaleString('fr-FR')}</TableCell>
                          <TableCell>
                            {box.status === 'DOWN' ? 'Box inaccessible' : 'Box fonctionnelle'}
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Aucune box trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Equipment Tab */}
          {tabValue === 2 && (
            <TableContainer component={Paper} className="dashboard-card" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Équipement</TableCell>
                    <TableCell>NumPin</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Site et Lieu</TableCell>
                    <TableCell>Dernière vérification</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : sites ? (
                    sites.flatMap((site) => 
                      (site.equipment || []).map((equip) => (
                        <TableRow 
                          key={equip.id}
                          hover
                          sx={{ 
                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                            backgroundColor: equip.status === 'CRITICAL' 
                              ? 'rgba(244, 67, 54, 0.05)' 
                              : equip.status === 'MAJOR' 
                                ? 'rgba(255, 152, 0, 0.05)' 
                                : 'inherit'
                          }}
                        >
                          <TableCell>{equip.name}</TableCell>
                          <TableCell>{equip.pinId}</TableCell>
                          <TableCell>{renderStatusChip(equip.status)}</TableCell>
                          <TableCell>{site.name} - {site.location}</TableCell>
                          <TableCell>{new Date().toLocaleString('fr-FR')}</TableCell>
                          <TableCell>{equip.type}</TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Aucun équipement trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Problems Tab */}
          {tabValue === 3 && (
            <TableContainer component={Paper} className="dashboard-card" sx={{ mb: 2 }}>
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : activeAlarms && activeAlarms.length > 0 ? (
                    activeAlarms.map((alarm) => (
                      <TableRow 
                        key={alarm.id}
                        hover
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
                        <TableCell>{new Date(alarm.timestamp).toLocaleString('fr-FR')}</TableCell>
                        <TableCell>
                          <Tooltip title="Voir détails du site">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSiteClick(alarm.siteId.replace(/\s+/g, '-'));
                              }}
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
                        Aucun problème trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default Monitoring;