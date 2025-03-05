// src/components/Navigation.js
import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Divider, 
  IconButton 
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, hasRole, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleClose();
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  // Get initial for Avatar
  const getInitials = () => {
    if (!currentUser) return 'G';
    if (currentUser.fullName) {
      const nameParts = currentUser.fullName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return currentUser.fullName[0].toUpperCase();
    }
    return currentUser.username[0].toUpperCase();
  };

  // Get user role label
  const getRoleLabel = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'administrator':
        return 'Administrateur';
      case 'supervisor':
        return 'Superviseur';
      case 'agent':
        return 'Agent';
      default:
        return currentUser.role;
    }
  };
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" 
          sx={{ 
            flexGrow: 0, 
            mr: 4, 
            textDecoration: 'none', 
            color: 'inherit' 
          }}>
          AlarmManager
        </Typography>
        
        <Box sx={{ flexGrow: 1, display: 'flex' }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/overview" 
            startIcon={<DashboardIcon />}
            sx={{ 
              mx: 1, 
              borderBottom: location.pathname === '/' || location.pathname === '/overview' ? '2px solid white' : 'none'
            }}
          >
            Overview
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/monitoring" 
            startIcon={<DashboardIcon />}
            sx={{ 
              mx: 1, 
              borderBottom: location.pathname === '/monitoring' ? '2px solid white' : 'none'
            }}
          >
            Monitoring
          </Button>
          
          {/* Admin-only Navigation Items */}
          {hasRole('administrator') && (
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/configuration" 
              startIcon={<SettingsIcon />}
              sx={{ 
                mx: 1, 
                borderBottom: location.pathname === '/configuration' ? '2px solid white' : 'none'
              }}
            >
              Configuration
            </Button>
          )}
          
          {/* Admin/Supervisor Navigation Items */}
          {hasRole(['administrator', 'supervisor']) && (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/statistique" 
                startIcon={<BarChartIcon />}
                sx={{ 
                  mx: 1, 
                  borderBottom: location.pathname === '/statistique' ? '2px solid white' : 'none'
                }}
              >
                Statistique
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/cartes" 
                startIcon={<MapIcon />}
                sx={{ 
                  mx: 1, 
                  borderBottom: location.pathname === '/cartes' ? '2px solid white' : 'none'
                }}
              >
                Cartes
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/historique" 
                startIcon={<HistoryIcon />}
                sx={{ 
                  mx: 1, 
                  borderBottom: location.pathname === '/historique' ? '2px solid white' : 'none'
                }}
              >
                Historique
              </Button>
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentUser?.fullName || currentUser?.username} ({getRoleLabel()})
          </Typography>
          <IconButton 
            size="large" 
            edge="end" 
            color="inherit" 
            onClick={handleMenu}
          >
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.9rem' }}>
              {getInitials()}
            </Avatar>
          </IconButton>
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
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profil
            </MenuItem>
            
            {hasRole('administrator') && (
              <MenuItem component={RouterLink} to="/configuration" onClick={handleClose}>
                <ListItemIcon>
                  <SupervisorAccountIcon fontSize="small" />
                </ListItemIcon>
                Administration
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={handleLogoutClick}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;