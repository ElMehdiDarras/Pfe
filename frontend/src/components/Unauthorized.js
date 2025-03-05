// src/components/Unauthorized.js
import React from 'react';
import { Container, Typography, Button, Paper, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleBackToSafety = () => {
    // Redirect based on user role
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role === 'administrator' || currentUser.role === 'supervisor' || currentUser === 'agent') {
      navigate('/dashboard');
    } else if (currentUser.sites && currentUser.sites.length > 0) {
      // For agents, navigate to their first assigned site
      const firstSiteId = currentUser.sites[0].replace(/\s+/g, '-');
      navigate(`/sites/${firstSiteId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ fontSize: 72, mb: 2 }} />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Accès non autorisé
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleBackToSafety}
            sx={{ mt: 2 }}
          >
            Retourner à une page autorisée
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized;