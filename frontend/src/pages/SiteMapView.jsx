// src/components/map/SiteMapView.jsx
import React, { useEffect, useRef } from 'react';
import {
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix the marker icon issue in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define accurate coordinates for known Moroccan cities
const CITY_COORDINATES = {
  'Rabat-Hay NAHDA': { latitude: 34.022405, longitude: -6.834543 },
  'Rabat-Soekarno': { latitude: 34.033742, longitude: -6.826401 },
  'Casa-Nations Unies': { latitude: 33.572422, longitude: -7.590944 },
  'Tanger': { latitude: 35.777222, longitude: -5.803889 },
  'Fès-Ville Nouvelle': { latitude: 34.033333, longitude: -5.000000 },
  'Fès-ALADARISSA': { latitude: 34.050531, longitude: -4.993580 },
  'Meknès-HAMRIA II': { latitude: 33.895000, longitude: -5.554722 },
  'Meknès-HAMRIA III': { latitude: 33.897300, longitude: -5.558100 },
  'Oujda-Téléphone': { latitude: 34.680800, longitude: -1.908600 },
  'Marrakech': { latitude: 31.631794, longitude: -8.008889 },
  'Agadir': { latitude: 30.427755, longitude: -9.598107 },
  'Tétouan': { latitude: 35.572356, longitude: -5.368890 },
  'Nador-LGD': { latitude: 35.174700, longitude: -2.930300 },
  'Settat-LGD': { latitude: 33.000800, longitude: -7.616700 },
  'Béni Mellal-LGD': { latitude: 32.334400, longitude: -6.355000 }
};

// Custom marker component with proper pulsing effect
const SiteMapView = ({ sites, height = 500, isLoading = false, error = null }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const pulseLayersRef = useRef([]);

  useEffect(() => {
    // Add the CSS for pulse animation if it doesn't exist
    if (!document.getElementById('pulse-animation-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation-style';
      style.textContent = `
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }
        .pulse-circle {
          animation: pulse 1.5s ease-out infinite;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Cleanup function will be called when component unmounts
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || isLoading || error) return;

    // Initialize map if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [31.794, -7.09], // Center on Morocco
        zoom: 6,
        maxBounds: [
          [20.0, -17.0], // Southwest corner
          [40.0, 0.0]    // Northeast corner
        ],
        maxBoundsViscosity: 1.0
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Clear previous markers and pulse layers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    pulseLayersRef.current.forEach(layer => layer.remove());
    pulseLayersRef.current = [];

    if (!sites || !sites.length) return;

    // Process sites and add markers for each
    sites.forEach((site) => {
      // Get accurate coordinates for the site
      let coordinates;

      // First try to find exact match in our predefined coordinates
      for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
        if (site.name && site.name.includes(cityName)) {
          coordinates = coords;
          break;
        }
      }

      // If no match, try to match partially
      if (!coordinates) {
        // Extract city name from site name
        let cityName = '';
        if (site.name && site.name.includes('-')) {
          cityName = site.name.split('-')[0].trim();
        } else if (site.location) {
          cityName = site.location.split(' ')[0].trim();
        }

        // Try to find by partial match
        for (const [knownCity, coords] of Object.entries(CITY_COORDINATES)) {
          if (knownCity.includes(cityName) || cityName.includes(knownCity.split('-')[0])) {
            coordinates = coords;
            break;
          }
        }
      }

      // If still no coordinates, use fallback or generate slightly random coords for demo
      if (!coordinates && site.coordinates) {
        coordinates = site.coordinates;
      } else if (!coordinates) {
        // Generate random coordinates around Morocco for demonstration
        coordinates = {
          latitude: 31.794 + (Math.random() - 0.5) * 4,
          longitude: -7.09 + (Math.random() - 0.5) * 4
        };
      }

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
        case 'OK':
          markerColor = '#4caf50';
          break;
        default:
          markerColor = '#4caf50'; // Default to OK
      }

      // Create marker and add to map
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const marker = L.marker([coordinates.latitude, coordinates.longitude], {
        icon: icon,
        title: site.name
      }).addTo(mapInstance.current);

      // Add popup with site information
      marker.bindPopup(
        `<div style="min-width: 200px;">
          <h3>${site.name || 'Site sans nom'}</h3>
          <p><strong>Statut:</strong> ${site.status || 'OK'}</p>
          <p><strong>Alarmes actives:</strong> ${site.activeAlarms || 0}</p>
          <p><strong>Emplacement:</strong> ${site.location || 'N/A'}</p>
        </div>`
      );

      markersRef.current.push(marker);

      // Add pulse effect for sites with active alarms
      if (site.activeAlarms > 0 || site.status === 'CRITICAL' || site.status === 'MAJOR') {
        // Create the pulse effect as a circle marker
        const pulseOptions = {
          radius: 20,
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.3,
          weight: 1,
          className: 'pulse-circle'
        };
        
        // We create a permanent layer for the pulse effect
        const pulseLayer = L.circleMarker(
          [coordinates.latitude, coordinates.longitude], 
          pulseOptions
        ).addTo(mapInstance.current);
        
        pulseLayersRef.current.push(pulseLayer);
      }
    });

    // Fit map to markers bounds if we have markers
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    // Make sure map is properly sized
    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 100);

    return () => {
      // This cleanup will run when the component unmounts or when dependencies change
    };
  }, [sites, isLoading, error]);

  // Handle window resize to update map size
  useEffect(() => {
    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">
          Erreur lors du chargement de la carte: {error.message || 'Erreur inconnue'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      ref={mapRef}
      sx={{ 
        height: height, 
        width: '100%',
        borderRadius: 1,
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default SiteMapView;