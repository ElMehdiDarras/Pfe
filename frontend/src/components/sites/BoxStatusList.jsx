// src/components/boxes/BoxStatusList.jsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Box,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import RouterIcon from '@mui/icons-material/Router';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';

const BoxStatusList = ({ boxes, isLoading, error }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          Erreur de chargement des boxes: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!boxes || boxes.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Aucune box trouvée
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {boxes.map((box, index) => (
          <React.Fragment key={box._id || index}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                {box.status === 'DOWN' ? (
                  <SignalWifiOffIcon color="error" />
                ) : (
                  <SignalWifi4BarIcon color="success" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {box.name}
                    </Typography>
                    <Chip 
                      label={box.status || 'UP'} 
                      size="small"
                      color={box.status === 'DOWN' ? 'error' : 'success'} 
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      sx={{ display: 'block' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      IP: {box.ip} - Port: {box.port || 502}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      Dernière vue: {box.lastSeen ? new Date(box.lastSeen).toLocaleString('fr-FR') : 'Jamais'}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < boxes.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default BoxStatusList;