// src/components/sites/BoxStatusList.jsx
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
  CircularProgress,
  Tooltip
} from '@mui/material';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

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

  // Helper function to determine status icon and color
  const getStatusInfo = (status) => {
    switch(status) {
      case 'DOWN':
        return { 
          icon: <SignalWifiOffIcon color="error" />, 
          chipColor: 'error',
          tooltip: 'Box hors ligne'
        };
      case 'UNREACHABLE':
        return { 
          icon: <HelpOutlineIcon color="warning" />, 
          chipColor: 'warning',
          tooltip: 'Box inaccessible'
        };
      case 'UP':
      default:
        return { 
          icon: <SignalWifi4BarIcon color="success" />, 
          chipColor: 'success',
          tooltip: 'Box en ligne'
        };
    }
  };

  return (
    <Paper sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {boxes.map((box, index) => {
          const statusInfo = getStatusInfo(box.status);
          
          return (
            <React.Fragment key={box._id || index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  <Tooltip title={statusInfo.tooltip}>
                    {statusInfo.icon}
                  </Tooltip>
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
                        color={statusInfo.chipColor}
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
          );
        })}
      </List>
    </Paper>
  );
};

export default BoxStatusList;