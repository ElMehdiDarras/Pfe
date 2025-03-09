// src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Button,
  Container
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  const navigate = useNavigate();
  
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
        <ErrorOutlineIcon
          color="error"
          sx={{ fontSize: 100, mb: 2 }}
        />
        
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Page Non Trouvée
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        
        <Button
          variant="contained"
          onClick={handleGoHome}
        >
          Retourner au Tableau de Bord
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound;