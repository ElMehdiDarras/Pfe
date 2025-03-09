// src/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <LockIcon
          color="error"
          sx={{ fontSize: 100, mb: 2 }}
        />
        
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Accès Non Autorisé
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          {user?.role === 'agent' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Votre rôle actuel (Agent) n'a accès qu'à certaines fonctionnalités et sites.
            </Typography>
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleGoBack}
          >
            Retour
          </Button>
          
          <Button
            variant="contained"
            onClick={handleGoHome}
          >
            Aller au Tableau de Bord
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;