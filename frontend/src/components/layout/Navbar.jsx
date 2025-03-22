// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onDrawerToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Handle menu open
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Handle profile navigation
  const handleProfile = () => {
    navigate('/Profile');
    handleClose();
  };
  
  // Handle settings navigation
  const handleSettings = () => {
    navigate('/Configuration');
    handleClose();
  };
  
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#2c4c7c', // ThingsBoard blue
        borderRadius: 0, // Ensure no rounded corners
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        

<Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
  <RouterLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
    <img 
      src="/icons/Maroc_telecom_logo.svg" 
      alt="Maroc Telecom" 
      style={{ height: '30px', marginRight: '12px' }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
    <Typography
      variant="h6"
      sx={{
        color: 'inherit',
        fontWeight: 'bold',
      }}
    >
      AlarmSense
    </Typography>
  </RouterLink>
</Box>
        
        {/* Spacer to push notification bell and user menu to the right */}
        <Box sx={{ flexGrow: 1 }} />
        
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notification Bell */}
            <NotificationBell />
            
            <Tooltip title="Menu utilisateur">
              <IconButton
                onClick={handleMenu}
                color="inherit"
                aria-label="account menu"
                sx={{ ml: 1 }}
              >
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: '#FF5722', // ThingsBoard orange
                    color: '#ffffff',
                  }}
                >
                  {user.firstName ? user.firstName.charAt(0) : user.username ? user.username.charAt(0) : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  minWidth: 200,
                  mt: 1,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email || user.username}
                </Typography>
              </Box>
              
              <Divider />
              
              <MenuItem onClick={handleProfile}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                Profil
              </MenuItem>
              
              {['administrator', 'supervisor'].includes(user.role) && (
                <MenuItem onClick={handleSettings}>
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                  Configuration
                </MenuItem>
              )}
              
              <Divider />
              
              <MenuItem onClick={handleLogout}>
                <ExitToAppIcon fontSize="small" sx={{ mr: 1 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button
            color="inherit"
            component={RouterLink}
            to="/login"
          >
            Connexion
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;