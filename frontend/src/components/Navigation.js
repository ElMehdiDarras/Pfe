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
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, hasRole } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Navigation handler - special case for monitoring
  const handleNavigation = (path, event) => {
    event.preventDefault(); // Prevent default link behavior
    console.log(`Navigating to: ${path}`);
    
    // For monitoring tab, use direct browser navigation to force a fresh load
    if (path === '/monitoring') {
      window.location.href = path;
    } else {
      // For other paths, use React Router
      navigate(path);
    }
  };
  
  // User menu handlers
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
    handleMenuClose();
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div"
          onClick={(e) => handleNavigation('/', e)}
          sx={{ 
            flexGrow: 0, 
            mr: 4, 
            textDecoration: 'none', 
            color: 'inherit',
            cursor: 'pointer'
          }}
        >
          AlarmManager
        </Typography>
        
        <Box sx={{ flexGrow: 1, display: 'flex' }}>
          <Button 
            color="inherit"
            onClick={(e) => handleNavigation('/overview', e)}
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
            onClick={(e) => handleNavigation('/monitoring', e)}
            startIcon={<DashboardIcon />}
            sx={{ 
              mx: 1, 
              borderBottom: location.pathname === '/monitoring' ? '2px solid white' : 'none'
            }}
          >
            Monitoring
          </Button>
          
          {/* Configuration - Only visible to administrators */}
          {hasRole('administrator') && (
            <Button 
              color="inherit"
              onClick={(e) => handleNavigation('/configuration', e)}
              startIcon={<SettingsIcon />}
              sx={{ 
                mx: 1, 
                borderBottom: location.pathname === '/configuration' ? '2px solid white' : 'none'
              }}
            >
              Configuration
            </Button>
          )}
          
          {/* Statistique - Only visible to admins/supervisors */}
          {hasRole(['administrator', 'supervisor']) && (
            <Button 
              color="inherit"
              onClick={(e) => handleNavigation('/statistique', e)}
              startIcon={<BarChartIcon />}
              sx={{ 
                mx: 1, 
                borderBottom: location.pathname === '/statistique' ? '2px solid white' : 'none'
              }}
            >
              Statistique
            </Button>
          )}
          
          {/* Cartes - Only visible to admins/supervisors */}
          {hasRole(['administrator', 'supervisor']) && (
            <Button 
              color="inherit"
              onClick={(e) => handleNavigation('/cartes', e)}
              startIcon={<MapIcon />}
              sx={{ 
                mx: 1, 
                borderBottom: location.pathname === '/cartes' ? '2px solid white' : 'none'
              }}
            >
              Cartes
            </Button>
          )}
          
          {/* Historique - Only visible to admins/supervisors */}
          {hasRole(['administrator', 'supervisor']) && (
            <Button 
              color="inherit"
              onClick={(e) => handleNavigation('/historique', e)}
              startIcon={<HistoryIcon />}
              sx={{ 
                mx: 1, 
                borderBottom: location.pathname === '/historique' ? '2px solid white' : 'none'
              }}
            >
              Historique
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentUser?.fullName || currentUser?.username || 'admin'} ({currentUser?.role || 'administrator'})
          </Typography>
          
          {/* User profile avatar with dropdown menu */}
          <IconButton 
            size="small" 
            onClick={handleProfileMenuOpen}
            sx={{ p: 0, ml: 1 }}
            aria-controls="profile-menu"
            aria-haspopup="true"
          >
            <Avatar 
              sx={{ 
                bgcolor: 'error.main', 
                width: 36, 
                height: 36, 
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              {(currentUser?.username?.[0] || 'A').toUpperCase()}
            </Avatar>
          </IconButton>
          
          {/* Profile dropdown menu */}
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profil Utilisateur
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
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