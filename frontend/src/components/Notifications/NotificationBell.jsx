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
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

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
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
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
        
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            mr: 2,
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
            fontWeight: 'bold',
          }}
        >
          AlarmManager
        </Typography>
        
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notification Bell Component */}
            <NotificationBell />
            
            <Tooltip title="Menu utilisateur">
              <IconButton
                onClick={handleMenu}
                color="inherit"
                aria-label="account menu"
              >
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}
                >
                  {user.firstName ? user.firstName.charAt(0) : 'U'}
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