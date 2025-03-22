// src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  Typography, 
  Box, 
  List, 
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import alarmService from '../../api/services/alarmService';
import { useSocket } from '../../context/SocketContext';

const NotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { lastMessage } = useSocket();
  const [notification, setNotification] = useState(null);

  // Fetch active alarms
  const { data: alarms = [], isLoading, error } = useQuery({
    queryKey: ['alarms', 'active'],
    queryFn: alarmService.getActiveAlarms,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutation for acknowledging alarms
  const acknowledgeMutation = useMutation({
    mutationFn: (alarmId) => alarmService.acknowledgeAlarm(alarmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    }
  });

  // Mutation for acknowledging all alarms
  const acknowledgeAllMutation = useMutation({
    mutationFn: () => alarmService.acknowledgeAllAlarms(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    }
  });

  // Listen for socket events
  useEffect(() => {
    if (lastMessage?.type === 'alarm-status-change') {
      // Show notification for critical and major alarms
      if (['CRITICAL', 'MAJOR'].includes(lastMessage.data?.status)) {
        setNotification({
          severity: lastMessage.data.status === 'CRITICAL' ? 'error' : 'warning',
          message: `${lastMessage.data.siteId || ''}: ${lastMessage.data.equipment || ''} - ${lastMessage.data.description || ''}`
        });
        
        // Play sound for critical alarms
        if (lastMessage.data.status === 'CRITICAL') {
          const audio = new Audio('/sounds/alarm.mp3');
          audio.play().catch(err => console.log('Failed to play sound:', err));
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
      
      // Refresh alarm data
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    }
  }, [lastMessage, queryClient]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // Refresh data when opening the menu
    queryClient.invalidateQueries({ queryKey: ['alarms', 'active'] });
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Fixed to receive the alarm ID directly
  const handleAcknowledge = (alarmId, event) => {
    // Stop propagation to prevent navigating to site detail
    if (event) {
      event.stopPropagation();
    }
    
    if (alarmId) {
      acknowledgeMutation.mutate(alarmId);
    } else {
      console.error('Cannot acknowledge: No alarm ID provided');
    }
  };

  const handleAcknowledgeAll = () => {
    acknowledgeAllMutation.mutate();
  };

  const handleAlarmClick = (siteId) => {
    handleClose();
    if (siteId) {
      navigate(`/SiteDetail/${siteId.replace(/\s+/g, '-')}`);
    }
  };

  // Count unacknowledged alarms
  const unacknowledgedCount = alarms?.filter(alarm => !alarm.acknowledgedBy).length || 0;

  // Get color and icon based on alarm status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'CRITICAL':
        return { icon: <ErrorIcon />, color: 'error.main' };
      case 'MAJOR':
        return { icon: <WarningIcon />, color: 'warning.main' };
      case 'WARNING':
        return { icon: <WarningIcon />, color: 'warning.light' };
      default:
        return { icon: <InfoIcon />, color: 'info.main' };
    }
  };

  // Format time since (e.g., "2 hours ago")
  const formatTimeSince = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays} j`;
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unacknowledgedCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            maxHeight: 500,
            width: '350px',
            mt: 1,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Alarmes
          </Typography>
          {unacknowledgedCount > 0 && (
            <Button
              startIcon={<DoneAllIcon />}
              size="small"
              onClick={handleAcknowledgeAll}
              disabled={acknowledgeAllMutation.isLoading}
            >
              Tout acquitter
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Typography color="error">
              Erreur de chargement des alarmes
            </Typography>
          </Box>
        ) : alarms?.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aucune alarme active
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {alarms.map((alarm) => {
              const { icon, color } = getStatusInfo(alarm.status);
              return (
                <React.Fragment key={alarm._id || `alarm-${alarm.siteId}-${alarm.pinId}-${alarm.timestamp}`}>
                  <ListItem 
                    button 
                    onClick={() => handleAlarmClick(alarm.siteId)}
                    sx={{ 
                      bgcolor: !alarm.acknowledgedBy ? 'action.hover' : 'inherit',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: color }}>
                        {icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {alarm.siteId || 'Site inconnu'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeSince(alarm.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {alarm.equipment || 'Équipement inconnu'}: {alarm.description || 'Aucune description'}
                          </Typography>
                          {!alarm.acknowledgedBy && (
                            <Button
                              size="small"
                              onClick={(e) => handleAcknowledge(alarm._id, e)}
                              sx={{ mt: 1, fontSize: '0.7rem' }}
                            >
                              Acquitter
                            </Button>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })}
          </List>
        )}
        
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Button fullWidth onClick={() => { handleClose(); navigate('/Monitoring'); }}>
            Voir toutes les alarmes
          </Button>
        </Box>
      </Menu>
      
      {/* Toast notification for new alarms */}
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {notification && (
          <Alert severity={notification.severity || 'info'} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default NotificationBell;