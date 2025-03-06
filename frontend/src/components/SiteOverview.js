import React from 'react';
import { Card, CardContent, CardHeader, Typography, Grid, Box, Chip } from '@mui/material';

function SiteOverview({ site }) {
  // Add defensive check at the beginning
  if (!site) {
    console.error('SiteOverview received undefined or null site object');
    return null;
  }

  console.log('Rendering SiteOverview for site:', site);
  
  // Handle click on site card - use direct browser navigation
  const handleClick = () => {
    console.log('Site clicked:', site);
    
    // Debug site identifiers
    console.log('Site identifiers:', {
      id: site.id,
      _id: site._id,
      name: site.name
    });
    
    // Get the most reliable identifier for site navigation
    let siteIdForUrl;
    
    // First try MongoDB _id (if available)
    if (site._id) {
      siteIdForUrl = site._id;
    }
    // Then try regular id
    else if (site.id) {
      siteIdForUrl = site.id;
    }
    // Finally, fall back to name with URL-safe formatting
    else if (site.name) {
      siteIdForUrl = site.name.replace(/\s+/g, '-');
    } else {
      console.error('No valid identifier found for site:', site);
      return;
    }
    
    console.log('Using site identifier for URL:', siteIdForUrl);
    
    // Use direct browser navigation to ensure it works
    window.location.href = `/sites/${siteIdForUrl}`;
  };
  
  // Set default values for missing properties
  const siteName = site.name || 'Site sans nom';
  const siteVlan = site.vlan || 'N/A';
  const siteDescription = site.description || `Site ${siteName}`;
  const siteLocation = site.location || 'Emplacement non spécifié';
  const siteIpRange = site.ipRange || 'N/A';
  const siteStatus = site.status || 'OK';
  const activeAlarms = site.activeAlarms || 0;
  const boxes = site.boxes || [];
  const equipment = site.equipment || [];
  
  return (
    <Card onClick={handleClick} sx={{ cursor: 'pointer', height: '100%' }}>
      <CardHeader
        title={siteName}
        subheader={`VLAN: ${siteVlan}`}
        action={
          <Box sx={{ mt: 1 }}>
            {siteStatus === 'OK' ? (
              <Chip label="OK" color="success" size="small" />
            ) : siteStatus === 'WARNING' ? (
              <Chip label={`${activeAlarms} Alarmes`} color="warning" size="small" />
            ) : (
              <Chip label={`${activeAlarms} Alarmes`} color="error" size="small" />
            )}
          </Box>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {siteDescription}
        </Typography>
        
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Emplacement:
            </Typography>
            <Typography variant="body2">
              {siteLocation}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Plage IP:
            </Typography>
            <Typography variant="body2">
              {siteIpRange}
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Équipement:
            </Typography>
            <Typography variant="body2">
              {`${boxes.length || 0} Boxes, ${equipment.length || 0} Équipements`}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default SiteOverview;