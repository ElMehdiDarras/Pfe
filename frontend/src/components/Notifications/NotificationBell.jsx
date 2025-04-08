// src/components/Notifications/NotificationBell.jsx
/**
 * Enhanced NotificationBell component with real-time popup notifications
 * 
 * IMPLEMENTATION NOTES:
 * 1. This component enhances the notification experience by showing a popup notification
 *    when a new alarm is received in real-time.
 * 
 * 2. IMPORTANT: Make sure you have the required sound files in your public/sounds directory:
 *    - /sounds/critical-alarm.mp3 - For critical alarms
 *    - /sounds/major-alarm.mp3 - For major alarms
 *    - /sounds/notification.mp3 - For general notifications
 * 
 * 3. The popup notification appears at the top right of the screen, below the AppBar
 * 
 * 4. Clicking on a notification will navigate to the relevant site detail page
 * 
 * 5. Audio will play based on the notification severity (if browser allows autoplay)
 */
import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
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
  Paper,
  Snackbar,
  Slide
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../../hooks/useAlarms';
import { useSocket } from '../../context/SocketContext';
// Import soundUtils with correct path
import soundUtils from '../../utils/soundUtils';

// Component for notification bell icon and dropdown
const NotificationBell = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { lastMessage } = useSocket();
  const [notificationPopup, setNotificationPopup] = useState(null);
  
  // Fetch notifications
  const { 
    data: notifications, 
    isLoading, 
    error 
  } = useNotifications();
  
  // Mutations for mark-as-read actions
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  
  // Handle new notification from socket
  useEffect(() => {
    if (lastMessage?.type === 'alarm-status-change' && 
        (lastMessage.data.status === 'CRITICAL' || lastMessage.data.status === 'MAJOR')) {
          console.log('NotificationBell processing message:', lastMessage);
      // Create a popup notification
      setNotificationPopup({
        id: new Date().getTime(),
        message: `${lastMessage.data.siteId}: ${lastMessage.data.equipment} - ${lastMessage.data.description}`,
        status: lastMessage.data.status,
        siteId: lastMessage.data.siteId,
        timestamp: new Date().toISOString()
      });
      
      // Play a sound for critical alerts (if browser allows)
      if (lastMessage.data.status === 'CRITICAL' || lastMessage.data.status === 'MAJOR') {
        soundUtils.playAlarmSound(lastMessage.data.status)
          .catch(err => console.log('Audio play failed:', err));
      }
      
      // Auto-hide the popup after 5 seconds
      setTimeout(() => {
        setNotificationPopup(null);
      }, 5000);
    }
  }, [lastMessage]);
  
  // Handle opening the menu
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle closing the menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  // Handle clicking on a notification
  const handleNotificationClick = (notification) => {
    // Mark notification as read
    markAsRead.mutate(notification.id);
    
    // Close menu
    handleCloseMenu();
    
    // Navigate to the site detail page
    if (notification.siteId) {
      const formattedSiteId = notification.siteId.replace(/\s+/g, '-');
      console.log(`Navigating to site: ${formattedSiteId}`);
      navigate(`/SiteDetail/${formattedSiteId}`);
    } else {
      // If no site ID, navigate to monitoring page
      navigate('/Monitoring');
    }
  };
  
  // Handle clicking on the popup notification
  const handlePopupClick = () => {
    if (notificationPopup?.siteId) {
      // Navigate to the site detail page
      navigate(`/SiteDetail/${notificationPopup.siteId.replace(/\s+/g, '-')}`);
      setNotificationPopup(null);
    }
  };
  
  // Handle dismissing the popup
  const handleDismissPopup = (e) => {
    e.stopPropagation();
    setNotificationPopup(null);
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
    handleCloseMenu();
  };
  
  // Get the count of unread notifications
  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  
  // Get the right icon for notification status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'CRITICAL':
        return <ErrorIcon color="error" />;
      case 'MAJOR':
        return <WarningIcon sx={{ color: 'orange' }} />;
      case 'WARNING':
        return <WarningIcon sx={{ color: 'gold' }} />;
      default:
        return <InfoIcon color="primary" />;
    }
  };
  
  // Format notification time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffMin < 1) return 'à l\'instant';
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHrs < 24) return `il y a ${diffHrs} h`;
    return `il y a ${diffDays} j`;
  };
  
  return (
    <>
      {/* Notification Bell Icon */}
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpenMenu}
          color="inherit"
          aria-label="notifications"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      {/* Notification Menu */}
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 500,
            overflow: 'auto',
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Notifications
          </Typography>
          
          {unreadCount > 0 && (
            <Button
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
              disabled={markAllAsRead.isLoading}
            >
              Tout marquer comme lu
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
              Erreur de chargement des notifications
            </Typography>
          </Box>
        ) : notifications?.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aucune notification
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.05)',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: 
                        notification.status === 'CRITICAL' ? 'error.main' : 
                        notification.status === 'MAJOR' ? 'warning.main' : 
                        notification.status === 'WARNING' ? 'warning.light' : 
                        'primary.main'
                    }}>
                      {getStatusIcon(notification.status)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        variant="body1"
                        fontWeight={notification.read ? 'normal' : 'medium'}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {formatTime(notification.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Button 
            fullWidth 
            onClick={() => {
              handleCloseMenu();
              navigate('/Historique');
            }}
          >
            Voir tous les alarmes
          </Button>
        </Box>
      </Menu>
      
      {/* Popup Notification for real-time alerts */}
      <Snackbar
        open={!!notificationPopup}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
        sx={{ 
          mt: 8, // Ensure it appears below the AppBar
          '& .MuiPaper-root': {
            width: '100%',
            minWidth: 300,
            maxWidth: 400,
          }
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 1,
            bgcolor: 
              notificationPopup?.status === 'CRITICAL' ? 'rgba(211, 47, 47, 0.95)' : 
              notificationPopup?.status === 'MAJOR' ? 'rgba(237, 108, 2, 0.95)' : 
              'rgba(25, 118, 210, 0.95)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 1,
          }}
          onClick={handlePopupClick}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ mr: 1 }}>
              {getStatusIcon(notificationPopup?.status)}
            </Box>
            <Box>
              <Typography variant="subtitle2">
                {notificationPopup?.status === 'CRITICAL' ? 'Alarme Critique' : 'Alarme Majeure'}
              </Typography>
              <Typography variant="body2">
                {notificationPopup?.message}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            size="small" 
            sx={{ color: 'white' }}
            onClick={handleDismissPopup}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Snackbar>
    </>
  );
};

export default NotificationBell;