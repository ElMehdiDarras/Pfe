// src/components/Logout.js
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
const Logout = () => {
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
    };
    
    performLogout();
  }, [logout]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="h6">Déconnexion en cours...</Typography>
      <Navigate to="/login" replace />
    </Box>
  );
};

export default Logout;