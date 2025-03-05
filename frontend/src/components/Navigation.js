import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';

function Navigation() {
  const location = useLocation();
  
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
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            IAM (Superviseur)
          </Typography>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.9rem' }}>
            IAM
          </Avatar>
          <Button color="inherit" startIcon={<LogoutIcon />} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;