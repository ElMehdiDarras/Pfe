// src/components/configuration/NotificationsConfigTab.jsx
import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Alert,
} from '@mui/material';

const NotificationsConfigTab = () => {
  // This is a placeholder component - in a real implementation, 
  // you would hook this up to your notification settings API
  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Paramètres de Notification</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configurez les paramètres de notification pour les alertes du système.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Cette fonctionnalité sera disponible dans une prochaine mise à jour.
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch defaultChecked disabled />}
              label="Activer les notifications par email"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email pour les notifications"
              defaultValue="admin@example.com"
              disabled
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch defaultChecked disabled />}
              label="Activer les notifications pour les alarmes critiques"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch disabled />}
              label="Activer les notifications pour les alarmes majeures"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch disabled />}
              label="Activer les notifications pour les alarmes warning"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" disabled>
                Enregistrer les paramètres
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default NotificationsConfigTab;