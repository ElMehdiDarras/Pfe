import React from 'react';
import { Card, CardContent, CardHeader, Typography, Grid, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function SiteOverview({ site }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/sites/${site.id}`);
  };
  
  return (
    <Card onClick={handleClick} sx={{ cursor: 'pointer', height: '100%' }}>
      <CardHeader
        title={site.name}
        subheader={`VLAN: ${site.vlan}`}
        action={
          <Box sx={{ mt: 1 }}>
            {site.status === 'OK' ? (
              <Chip label="OK" color="success" size="small" />
            ) : site.status === 'WARNING' ? (
              <Chip label={`${site.activeAlarms} Alarmes`} color="warning" size="small" />
            ) : (
              <Chip label={`${site.activeAlarms} Alarmes`} color="error" size="small" />
            )}
          </Box>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {site.description}
        </Typography>
        
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Emplacement:
            </Typography>
            <Typography variant="body2">
              {site.location}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Plage IP:
            </Typography>
            <Typography variant="body2">
              {site.ipRange}
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Équipement:
            </Typography>
            <Typography variant="body2">
              {`${site.boxes?.length || 0} Boxes, ${site.equipment?.length || 0} Équipements`}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default SiteOverview;