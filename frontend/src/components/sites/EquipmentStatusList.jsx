// src/components/equipment/EquipmentStatusList.jsx
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
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import PowerIcon from '@mui/icons-material/Power';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const EquipmentStatusList = ({ equipment, isLoading, error }) => {
  // Get icon based on equipment type
  const getEquipmentIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'climatiseur':
        return <AcUnitIcon />;
      case 'armoire électrique':
      case 'armoire electrique':
        return <PowerIcon />;
      case 'redresseur':
        return <BatteryAlertIcon />;
      case 'thermostat':
        return <ThermostatIcon />;
      case 'centrale incendie':
        return <LocalFireDepartmentIcon />;
      default:
        return <DeviceHubIcon />;
    }
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'CRITICAL':
        return <Chip label="CRITICAL" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />;
      case 'MAJOR':
        return <Chip label="MAJOR" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />;
      case 'WARNING':
        return <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ffeb3b', color: 'black' }} />;
      case 'OK':
        return <Chip label="OK" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />;
      default:
        return <Chip label={status || 'UNKNOWN'} size="small" />;
    }
  };

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
          Erreur de chargement des équipements: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!equipment || equipment.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Aucun équipement trouvé
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {equipment.map((equip, index) => (
          <React.Fragment key={equip._id || index}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                {getEquipmentIcon(equip.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {equip.name}
                    </Typography>
                    {getStatusChip(equip.status)}
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
                      Type: {equip.type || 'Non spécifié'}
                    </Typography>
                    {equip.boxId && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        Box ID: {equip.boxId} - Pin: {equip.pinId || 'N/A'}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
            {index < equipment.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default EquipmentStatusList;