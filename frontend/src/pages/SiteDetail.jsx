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
  TableRow,
  Tabs,
  Tab,
  Chip,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSiteById } from '../hooks/useSites';
import { useAlarmsBySite } from '../hooks/useAlarms';
import AlarmTable from '../components/alarms/AlarmTable';
import AlarmStatusChart from '../components/alarms/AlarmStatusChart';
import EquipmentStatusList from '../components/sites/EquipmentStatusList';
import BoxStatusList from '../components/sites/BoxStatusList';

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
                      // This is sample data - you would transform your actual alarm data here
                      // or pass it directly to the component if it's already in the right format
                      { hour: '0h', critical: 0, major: 0, warning: 0 },
                      { hour: '1h', critical: 0, major: 0, warning: 2 },
                      { hour: '2h', critical: 2, major: 2, warning: 0 },
                      /* ... more hourly data ... */
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
      
      {/* New Architecture tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper className="card">
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Architecture du Site</Typography>
          </Box>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            {/* Placeholder for the architecture image */}
            <Box sx={{ 
              width: '100%', 
              height: 400, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              border: '1px dashed #ccc',
              borderRadius: 1,
              mb: 2
            }}>
              {/* This section will display your image. Replace this with actual image when available */}
              <Typography color="text.secondary">
                Architecture diagram will be displayed here
              </Typography>
              {/* When you have the image ready, uncomment and use this instead: */}
              {/* <img 
                src={`/images/architecture/${siteId}.png`} 
                alt={`Architecture de ${site.name}`}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              /> */}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body1" align="left" paragraph>
              Ce diagramme représente l'architecture complète du site {site.name}, montrant tous les composants et leurs interconnexions.
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
      
      <TabPanel value={tabValue} index={4}>
        <Paper className="card">
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Historique des Alarmes</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {/* Implement your history component here */}
            <Alert severity="info">
              L'historique détaillé des alarmes sera disponible prochainement
            </Alert>
          </Box>
        </Paper>
      </TabPanel>
    </div>
  );
};

export default SiteDetail;