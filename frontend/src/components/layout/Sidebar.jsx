// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  useMediaQuery,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { hasPermission } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';

// Define drawer width
const drawerWidth = 240;

const Sidebar = ({ mobileOpen = false, onDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // State to manage nested list items
  const [open, setOpen] = useState({
    monitoring: false,
    sites: false
  });

  // Handle nested list toggle
  const handleClick = (section) => {
    setOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isSmallScreen && onDrawerToggle) {
      onDrawerToggle();
    }
  };

  // Styles for menu items
  const menuItemStyles = {
    color: '#ffffff',
    '&.Mui-selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
      },
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  };

  // Styles for icons
  const iconStyles = {
    color: 'rgba(255, 255, 255, 0.7)',
  };

  // Conditional drawer content (permanent on large screens, temporary on small)
  const drawerContent = (
    <Box sx={{ overflow: 'auto', mt: 2 }}>
      <List sx={{ p: 1 }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/'} 
            onClick={() => handleNavigation('/')}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={iconStyles}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Tableau de bord" />
          </ListItemButton>
        </ListItem>

        {/* Monitoring */}
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/Monitoring'} 
            onClick={() => handleNavigation('/Monitoring')}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={iconStyles}>
              <MonitorHeartIcon />
            </ListItemIcon>
            <ListItemText primary="Monitoring" />
          </ListItemButton>
        </ListItem>

        {/* Statistics */}
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/Statistics'} 
            onClick={() => handleNavigation('/Statistics')}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={iconStyles}>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Statistiques" />
          </ListItemButton>
        </ListItem>

        {/* Sites Map */}
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/Cartes'} 
            onClick={() => handleNavigation('/Cartes')}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={iconStyles}>
              <MapIcon />
            </ListItemIcon>
            <ListItemText primary="Cartes" />
          </ListItemButton>
        </ListItem>

        {/* History */}
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/Historique'} 
            onClick={() => handleNavigation('/Historique')}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={iconStyles}>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText primary="Historique" />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Configuration - Only shown to admin and supervisor */}
        {user && (user.role === 'administrator' || user.role === 'supervisor') && (
          <>
            <ListItem disablePadding>
              <ListItemButton 
                selected={location.pathname === '/Configuration'} 
                onClick={() => handleNavigation('/Configuration')}
                sx={menuItemStyles}
              >
                <ListItemIcon sx={iconStyles}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Configuration" />
              </ListItemButton>
            </ListItem>

            {/* User Management - Admin only */}
            {user.role === 'administrator' && (
              <ListItem disablePadding>
                <ListItemButton 
                  selected={location.pathname === '/UserManagement'} 
                  onClick={() => handleNavigation('/UserManagement')}
                  sx={menuItemStyles}
                >
                  <ListItemIcon sx={iconStyles}>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Utilisateurs" />
                </ListItemButton>
              </ListItem>
            )}
            
            <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          </>
        )}

        {/* Profile */}
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/Profile'} 
            onClick={() => handleNavigation('/Profile')}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={iconStyles}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profil" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer (temporary) */}
      {isSmallScreen && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#2c4c7c', // ThingsBoard blue
              color: '#ffffff',
              borderRadius: 0, // Ensure no rounded corners
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop drawer (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            position: 'fixed',
            height: '100%',
            backgroundColor: '#2c4c7c', // ThingsBoard blue
            color: '#ffffff',
            borderRadius: 0, // Ensure no rounded corners
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            top: 64,  // AppBar height
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;