// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HomeIcon from '@mui/icons-material/Home';
import MonitorIcon from '@mui/icons-material/SettingsInputComponent';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import MapIcon from '@mui/icons-material/Map';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ onDrawerToggle }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleMenuClose();
  };

  // Generate initials from user name
  const getInitials = () => {
    if (!user) return 'IAM';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  const navItems = [
    { label: 'OVERVIEW', icon: <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />, path: '/' },
    { label: 'MONITORING', icon: <MonitorIcon sx={{ mr: 0.5, fontSize: 20 }} />, path: '/monitoring' },
    { label: 'CONFIGURATION', icon: <SettingsIcon sx={{ mr: 0.5, fontSize: 20 }} />, path: '/configuration' },
    { label: 'STATISTIQUE', icon: <BarChartIcon sx={{ mr: 0.5, fontSize: 20 }} />, path: '/statistics' },
    { label: 'CARTES', icon: <MapIcon sx={{ mr: 0.5, fontSize: 20 }} />, path: '/cartes' },
    { label: 'HISTORIQUE', icon: <HistoryIcon sx={{ mr: 0.5, fontSize: 20 }} />, path: '/historique' },
  ];

  return (
    <AppBar
      position="fixed"
      sx={{
        width: '100%',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1976d2',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
      }}
    >
      <Toolbar sx={{ minHeight: '64px' }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontWeight: 'medium',
            mr: 4,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          AlarmManager
        </Typography>

        {/* Navigation buttons */}
        <Box 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            flexGrow: 1
          }}
        >
          {navItems.map((item) => (
            <Button
              key={item.label}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.875rem',
                mx: 0.5,
                ...(location.pathname === item.path && {
                  borderBottom: '3px solid white',
                  borderRadius: 0,
                  paddingBottom: '3px'
                })
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
        
        {/* Profile section */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                flexDirection: 'column', 
                alignItems: 'flex-end',
                mr: 1
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'medium',
                  fontSize: '0.8rem'
                }}
              >
                {user.username || "IAM"}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem'
                }}
              >
                ({user.role === 'administrator' ? 'Administrateur' : 
                  user.role === 'supervisor' ? 'Superviseur' : 'Agent'})
              </Typography>
            </Box>
            
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
            >
              <Avatar 
                sx={{ 
                  bgcolor: '#ba68c8', 
                  width: 32, 
                  height: 32, 
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                {getInitials()}
              </Avatar>
            </IconButton>
            
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
              PaperProps={{
                elevation: 3,
                sx: {
                  minWidth: 180,
                  mt: 1,
                  '& .MuiMenuItem-root': {
                    px: 2, 
                    py: 1,
                  },
                },
              }}
            >
              <MenuItem onClick={handleProfile}>
                <PersonIcon fontSize="small" sx={{ mr: 2 }} />
                Profil
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;