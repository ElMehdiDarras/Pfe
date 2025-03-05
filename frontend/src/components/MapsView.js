import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Box, Chip, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useData } from '../context/DataProvider';

// Fix for the marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapsView() {
  const { sites, loading } = useData();
  
  console.log('MapsView: Rendering with sites:', sites);
  
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Define marker locations based on site data
  const markers = sites.map(site => {
    // Define positions (these are approximate for demonstration)
    let position;
    if (site.name === 'Rabat-Soekarno') {
      position = [34.01, -6.84];
    } else if (site.name === 'Rabat-Hay NAHDA') {
      position = [34.02, -6.81];
    } else if (site.name === 'Casa-Nations Unies') {
      position = [33.59, -7.62];
    } else {
      // Default position if site is unknown
      position = [34.00, -6.85];
    }

    // Determine icon based on site status
    let icon;
    if (site.status === 'CRITICAL') {
      icon = redIcon;
    } else if (site.status === 'WARNING' || site.status === 'MAJOR') {
      icon = orangeIcon;
    } else {
      icon = greenIcon;
    }

    return {
      id: site.id,
      position,
      name: site.name,
      status: site.status,
      alarms: site.activeAlarms || 0,
      icon
    };
  });
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cartes des Sites
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">Carte Globale des Sites</Typography>
        </Box>
        
        <Box sx={{ height: 500, width: '100%' }}>
          <MapContainer 
            center={[34.0, -6.8]} 
            zoom={9} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {markers.map(marker => (
              <Marker 
                key={marker.id} 
                position={marker.position} 
                icon={marker.icon}
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '5px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {marker.name}
                    </div>
                    {marker.status !== 'OK' && (
                      <div 
                        style={{ 
                          backgroundColor: marker.status === 'CRITICAL' ? '#f44336' : '#ff9800',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          display: 'inline-block'
                        }}
                      >
                        {marker.alarms} Alarmes
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Box>
      </Card>
      
      <Typography variant="h5" sx={{ mb: 2 }}>
        Diagrammes de Sites
      </Typography>
      
      <Grid container spacing={3}>
        {sites.map((site) => {
          // Set status based on site name
          const isOk = site.status === 'OK';
          const isCritical = site.status === 'CRITICAL';
          const alarmCount = site.activeAlarms || 0;
          
          return (
            <Grid item xs={12} md={4} key={site.id}>
              <Card>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{site.name}</Typography>
                  {isOk ? (
                    <Chip label="Tous les systèmes OK" color="success" sx={{ borderRadius: 16 }} />
                  ) : (
                    <Chip 
                      label={`${alarmCount} Alarmes`} 
                      color={isCritical ? "error" : "warning"} 
                      sx={{ borderRadius: 16 }} 
                    />
                  )}
                </Box>
                
                <CardContent>
                  <Box sx={{ 
                    border: '1px solid #ddd', 
                    borderRadius: 1, 
                    p: 2, 
                    mb: 2 
                  }}>
                    {/* Equipment header labels */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption">Armoire électrique</Typography>
                      <Typography variant="caption">Climatiseurs</Typography>
                      <Typography variant="caption">Thermostat</Typography>
                    </Box>
                    
                    {/* Equipment diagram */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {/* Armoire électrique */}
                      <Box sx={{ 
                        width: '30%', 
                        height: 150, 
                        bgcolor: '#f0f0f0', 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: isOk ? '#4caf50' : '#f44336' 
                        }} />
                      </Box>
                      
                      {/* Climatiseurs */}
                      <Box sx={{ 
                        width: '30%', 
                        height: 150, 
                        bgcolor: '#f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: isOk ? '#4caf50' : '#f44336' 
                        }} />
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: isOk ? '#4caf50' : '#f44336' 
                        }} />
                      </Box>
                      
                      {/* Thermostat */}
                      <Box sx={{ 
                        width: '30%', 
                        height: 150, 
                        bgcolor: '#f0f0f0',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: isOk ? '#4caf50' : '#f44336' 
                        }} />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {site.location} | VLAN: {site.vlan} | {(site.equipment || []).length} équipements
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

export default MapsView;