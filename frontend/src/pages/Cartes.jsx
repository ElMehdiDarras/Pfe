// src/pages/Cartes.jsx
import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useSites } from '../hooks/useSites';
import SiteMapView from './SiteMapView';

// Equipment diagram component
const EquipmentDiagram = ({ site }) => {
  const getEquipmentStatus = (type) => {
    const equipment = site.equipment?.filter(e => e.type && e.type.includes(type)) || [];
    
    if (equipment.length === 0) return 'OK';
    
    if (equipment.some(e => e.status === 'CRITICAL')) return 'CRITICAL';
    if (equipment.some(e => e.status === 'MAJOR')) return 'MAJOR';
    if (equipment.some(e => e.status === 'WARNING')) return 'WARNING';
    
    return 'OK';
  };
  
  const getStatusIndicator = (status) => {
    let bgColor;
    
    switch (status) {
      case 'CRITICAL':
        bgColor = '#f44336';
        break;
      case 'MAJOR':
        bgColor = '#ff9800';
        break;
      case 'WARNING':
        bgColor = '#ffeb3b';
        break;
      case 'OK':
        bgColor = '#4caf50';
        break;
      default:
        bgColor = '#9e9e9e';
    }
    
    return (
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: bgColor,
          border: '1px solid white',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          mx: 'auto',
          my: 1
        }}
      />
    );
  };

  // Equipment types based on your data model
  const equipmentTypes = ['Armoire électrique', 'Climatiseurs', 'Thermostat'];
  
  const statusCounts = {
    criticals: site.equipment?.filter(e => e.status === 'CRITICAL').length || 0,
    majors: site.equipment?.filter(e => e.status === 'MAJOR').length || 0,
    warnings: site.equipment?.filter(e => e.status === 'WARNING').length || 0
  };
  
  const getStatusChip = () => {
    if (statusCounts.criticals > 0) {
      return <Chip 
        label={`${statusCounts.criticals} Alarmes`} 
        color="error" 
        size="small"
      />;
    }
    
    if (statusCounts.majors > 0) {
      return <Chip 
        label={`${statusCounts.majors} Alarmes`} 
        color="warning" 
        size="small"
      />;
    }
    
    if (statusCounts.warnings > 0) {
      return <Chip 
        label={`${statusCounts.warnings} Alarmes`} 
        sx={{ bgcolor: '#ffeb3b', color: 'black' }} 
        size="small"
      />;
    }
    
    return <Chip 
      label="Tous les systèmes OK" 
      color="success" 
      size="small"
    />;
  };

  return (
    <Card>
      <CardHeader
        title={site.name}
        titleTypographyProps={{ variant: 'h6', sx: { fontSize: '1rem' } }}
        action={getStatusChip()}
      />
      <Divider />
      <CardContent sx={{ p: 1 }}>
        <Grid container spacing={1}>
          {equipmentTypes.map((type) => {
            const status = getEquipmentStatus(type);
            return (
              <Grid item xs={4} key={type}>
                <Box sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                  border: '1px solid #eee'
                }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1 }}>
                    {type}
                  </Typography>
                  {getStatusIndicator(status)}
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          {site.location} | VLAN: {site.vlan || 'N/A'} | {site.equipment?.length || 0} équipements
        </Typography>
      </CardContent>
    </Card>
  );
};

const Cartes = () => {
  const { data: sites, isLoading, error } = useSites();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Erreur de chargement des données: {error.message}</Alert>;
  }

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
        Cartes des Sites
      </Typography>

      {/* Global Map */}
      <Paper sx={{ mb: 4, p: 2, borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
          Carte Globale des Sites
        </Typography>
        {/* Using our improved map component */}
        <SiteMapView sites={sites || []} height={500} />
      </Paper>

      {/* Site diagrams */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.2rem' }}>
        Diagrammes de Sites
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {sites?.map((site) => (
          <Grid item xs={12} sm={6} md={4} key={site.id || site._id}>
            <EquipmentDiagram site={site} />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default Cartes;