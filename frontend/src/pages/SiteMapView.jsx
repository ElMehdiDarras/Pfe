// src/pages/SiteMapView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Button
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSites } from '../hooks/useSites';

// Create custom icon based on status
const createCustomIcon = (status) => {
  // Map status to icon file
  let iconPath;
  switch (status?.toUpperCase()) {
    case 'CRITICAL':
      iconPath = '/icons/marker-critical.svg';
      break;
    case 'MAJOR':
      iconPath = '/icons/marker-major.svg';
      break;
    case 'WARNING':
      iconPath = '/icons/marker-warning.svg';
      break;
    case 'OK':
      iconPath = '/icons/datacenter-ok.svg';
      break;
    default:
      iconPath = '/icons/marker-ok.svg';
  }
  
  return L.icon({
    iconUrl: iconPath,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Component to set map bounds to markers
const SetBoundsToMarkers = ({ markers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (markers && markers.length > 0) {
      const validMarkers = markers.filter(
        marker => marker.coordinates && 
        marker.coordinates.latitude && 
        marker.coordinates.longitude
      );
      
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(
          validMarkers.map(marker => [
            marker.coordinates.latitude,
            marker.coordinates.longitude
          ])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, markers]);
  
  return null;
};

const SiteMapView = ({ sites, height = 400, settings = {} }) => {
  const { data: sitesData, isLoading, error } = useSites();
  const [markers, setMarkers] = useState([]);
  
  // Use provided sites or fetched sites data
  const displaySites = sites && sites.length > 0 ? sites : sitesData;
  
  // No need for complex marker settings as we're using SVG icons
  
  // Prepare markers from sites data
  useEffect(() => {
    if (displaySites) {
      const siteMarkers = displaySites
        .filter(site => site.coordinates && site.coordinates.latitude && site.coordinates.longitude)
        .map(site => ({
          id: site.id || site._id,
          name: site.name,
          status: site.status || 'OK',
          location: site.location,
          activeAlarms: site.activeAlarms || 0,
          coordinates: site.coordinates
        }));
      
      setMarkers(siteMarkers);
    }
  }, [displaySites]);
  
  // Handle click on a marker
  const handleMarkerClick = (site) => {
    if (settings.onSiteClick && typeof settings.onSiteClick === 'function') {
      settings.onSiteClick(site);
    }
  };
  
  // Get the appropriate icon based on site status
  const getIconForStatus = (status) => {
    return createCustomIcon(status);
  };
  
  if (isLoading && !sites) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !sites) {
    return <Alert severity="error">Erreur de chargement des données: {error.message}</Alert>;
  }
  
  if ((!displaySites || displaySites.length === 0) && (!markers || markers.length === 0)) {
    return (
      <Alert severity="info">Aucun site disponible avec des coordonnées pour affichage sur la carte</Alert>
    );
  }
  
  return (
    <Box sx={{ height: height, width: '100%', position: 'relative' }} className="map-container">
      <MapContainer 
        center={[31.7917, -7.0926]} // Default center on Morocco
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        className="site-map"
      >
        {/* Standard OpenStreetMap Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((marker) => (
          <Marker
            key={marker.id || marker.name}
            position={[marker.coordinates.latitude, marker.coordinates.longitude]}
            icon={getIconForStatus(marker.status)}
            eventHandlers={{
              click: () => {
                // Direct navigation mode - don't do anything with the popup
                if (settings.disablePopup) {
                  handleMarkerClick(
                    displaySites.find(site => 
                      (site.id === marker.id) || 
                      (site._id === marker.id) || 
                      (site.name === marker.name)
                    )
                  );
                }
              }
            }}
          >
            <Popup className="site-popup">
              <Box className="site-popup-content">
                <Typography variant="subtitle1" className="site-popup-title">
                  {marker.name}
                </Typography>
                <Box className="site-popup-status">
                  <Typography variant="body2">Statut:</Typography>
                  <Chip 
                    label={marker.status} 
                    size="small"
                    className={`status-chip ${marker.status?.toLowerCase()}-chip`}
                  />
                </Box>
                <Typography variant="body2" className="site-popup-info">
                  Location: {marker.location}
                </Typography>
                <Typography variant="body2" className="site-popup-info">
                  Alarmes actives: {marker.activeAlarms}
                </Typography>
                
                <Box className="site-popup-actions">
                  <Button
                    variant="contained"
                    className="site-details-button"
                    fullWidth
                    onClick={() => handleMarkerClick(
                      displaySites.find(site => 
                        (site.id === marker.id) || 
                        (site._id === marker.id) || 
                        (site.name === marker.name)
                      )
                    )}
                  >
                    Voir les détails du site
                  </Button>
                </Box>
              </Box>
            </Popup>
          </Marker>
        ))}
        
        <SetBoundsToMarkers markers={markers} />
      </MapContainer>
    </Box>
  );
};

export default SiteMapView;