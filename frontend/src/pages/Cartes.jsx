// src/pages/Cartes.jsx
import React, { useEffect, useRef } from 'react';
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
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix the marker icon issue in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored marker icon
const createColoredMarker = (color) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Map component
const MapComponent = ({ sites }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || !sites || sites.length === 0) return;

    // Initialize map if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([31.794, -7.09], 6); // Center on Morocco

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Generate mock coordinates for sites if not provided
    const sitesWithCoordinates = sites.map((site, index) => {
      if (site.coordinates?.latitude && site.coordinates?.longitude) {
        return site;
      }
      
      // Use predefined coordinates for specific cities or generate mock ones
      let coordinates;
      
      if (site.name.includes('Rabat')) {
        coordinates = { latitude: 34.022405, longitude: -6.834543 };
      } else if (site.name.includes('Casa')) {
        coordinates = { latitude: 33.572422, longitude: -7.590944 };
      } else if (site.name.includes('Fes')) {
        coordinates = { latitude: 34.033333, longitude: -5.000000 };
      } else if (site.name.includes('Meknes')) {
        coordinates = { latitude: 33.895000, longitude: -5.554722 };
      } else if (site.name.includes('Tanger')) {
        coordinates = { latitude: 35.777222, longitude: -5.803889 };
      } else if (site.name.includes('Marrakech')) {
        coordinates = { latitude: 31.631794, longitude: -8.008889 };
      } else {
        // Generate random coordinates in Morocco if city not recognized
        coordinates = {
          latitude: 31.794 + (Math.random() - 0.5) * 5,
          longitude: -7.09 + (Math.random() - 0.5) * 5
        };
      }
      
      return { ...site, coordinates };
    });

    // Add markers for each site
    sitesWithCoordinates.forEach((site, index) => {
      const { coordinates } = site;
      if (!coordinates) return;
      
      // Determine marker color based on site status
      let markerColor;
      switch (site.status) {
        case 'CRITICAL':
          markerColor = '#f44336';
          break;
        case 'MAJOR':
          markerColor = '#ff9800';
          break;
        case 'WARNING':
          markerColor = '#ffeb3b';
          break;
        default:
          markerColor = '#4caf50'; // OK status
      }

      const marker = L.marker([coordinates.latitude, coordinates.longitude], {
        icon: createColoredMarker(markerColor),
        title: site.name
      }).addTo(mapInstance.current);

      // Add popup with site information
      marker.bindPopup(
        `<div style="min-width: 200px;">
          <h3>${site.name}</h3>
          <p><strong>Statut:</strong> ${site.status || 'OK'}</p>
          <p><strong>Alarmes actives:</strong> ${site.activeAlarms || 0}</p>
          <p><strong>Emplacement:</strong> ${site.location || 'N/A'}</p>
        </div>`
      );

      // Add pulse effect for sites with active alarms
      if (site.activeAlarms > 0) {
        const pulseCircle = L.circleMarker([coordinates.latitude, coordinates.longitude], {
          radius: 15,
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.3,
          weight: 1,
          className: 'pulse-circle'
        }).addTo(mapInstance.current);
        
        markersRef.current.push(pulseCircle);
      }

      markersRef.current.push(marker);
    });

    // Add CSS for pulse animation
    if (!document.getElementById('pulse-animation-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation-style';
      style.textContent = `
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .pulse-circle {
          animation: pulse 1.5s infinite;
        }
      `;
      document.head.appendChild(style);
    }

    // Make sure map is properly sized
    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 100);

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        // Just clear markers, don't remove the map
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
      }
    };
  }, [sites]);

  return (
    <Box 
      ref={mapRef}
      sx={{ 
        height: '500px', 
        width: '100%',
        borderRadius: 1,
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

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
    return <Alert severity="error">Erreur de chargement des données</Alert>;
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
        <MapComponent sites={sites || []} />
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