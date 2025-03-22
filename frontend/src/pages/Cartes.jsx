// src/pages/Cartes.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { useSites } from '../hooks/useSites';
import SiteMapView from './SiteMapView';

const Cartes = () => {
  const navigate = useNavigate();
  const [selectedSite, setSelectedSite] = useState(null);
  const { data: sites, isLoading, error } = useSites();
  
  // Handle site click from map
  const handleSiteClick = (site) => {
    if (site && site.id) {
      navigate(`/SiteDetail/${site.id}`);
    } else if (site && site.name) {
      // If we don't have an ID but have a name, try using the name as ID
      const siteId = site.name.replace(/\s+/g, '-');
      navigate(`/SiteDetail/${siteId}`);
    }
  };
  
  return (
    <div className="content-wrapper">
      <Typography variant="h4" className="page-title">
        Carte Globale des Sites
      </Typography>
      
      <Grid container spacing={3}>
        {/* Map Container */}
        <Grid item xs={12}>
          <Paper elevation={0} className="card">
            <Box sx={{ position: 'relative', height: 500 }}>
              {isLoading ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%' 
                }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3 }}>
                  <Alert severity="error">
                    Erreur lors du chargement de la carte: {error.message}
                  </Alert>
                </Box>
              ) : (
                <SiteMapView 
                  sites={sites} 
                  height={500} 
                  settings={{ 
                    onSiteClick: handleSiteClick,
                  }} 
                />
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Site Status Grid */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2 }}>
            État des Sites
          </Typography>
          
          <Grid container spacing={2}>
            {isLoading ? (
              <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
              </Grid>
            ) : error ? (
              <Grid item xs={12}>
                <Alert severity="error">
                  Erreur lors du chargement des sites: {error.message}
                </Alert>
              </Grid>
            ) : sites && sites.length > 0 ? (
              sites.map(site => (
                <Grid item xs={12} sm={6} md={4} key={site.id || site.name}>
                  <Card 
                    className={`card site-card ${site.status?.toLowerCase() || 'ok'}-card`}
                    onClick={() => handleSiteClick(site)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box className="site-card-header">
                      <Typography variant="h6" className="site-card-title">
                        {site.name}
                      </Typography>
                      <Box 
                        className={`status-indicator ${site.status?.toLowerCase() || 'ok'}`}
                        sx={{ width: 14, height: 14 }}
                      />
                    </Box>
                    
                    <CardContent className="site-card-content">
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Location: {site.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        VLAN: {site.vlan || 'N/A'}
                      </Typography>
                      
                      <Divider sx={{ my: 1.5 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          Alarmes actives:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={site.activeAlarms > 0 ? 'error.main' : 'success.main'}
                        >
                          {site.activeAlarms || 0}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <Box className="site-card-footer">
                      <Typography variant="caption" color="text.secondary">
                        {site.equipment ? `${site.equipment.length} équipements` : ''}
                      </Typography>
                      
                      <Button 
                        size="small" 
                        className="site-details-button"
                        sx={{ minWidth: 'auto' }}
                      >
                        Détails
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Aucun site disponible
                </Alert>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Cartes;