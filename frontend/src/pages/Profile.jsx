// src/pages/Profile.jsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Divider,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Basic validation
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    
    if (passwords.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }
    
    try {
      // Here you would call your auth service to change the password
      // await authService.changePassword(passwords.currentPassword, passwords.newPassword);
      
      // For now, we'll simulate a successful response
      setTimeout(() => {
        setSuccess(true);
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Une erreur est survenue lors du changement de mot de passe');
      setLoading(false);
    }
  };
  
  // Format role for display
  const formatRole = (role) => {
    switch (role) {
      case 'administrator':
        return 'Administrateur';
      case 'supervisor':
        return 'Superviseur';
      case 'agent':
        return 'Agent';
      default:
        return role;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };
  
  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
        Profil Utilisateur
      </Typography>
      
      <Grid container spacing={3}>
        {/* User Information Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0, borderRadius: 1 }}>
            <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              Informations
            </Typography>
            
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#1976d2',
                  mr: 3,
                  fontSize: '1.5rem'
                }}
              >
                {getInitials(user.firstName, user.lastName)}
              </Avatar>
              
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatRole(user.role)}
                </Typography>
              </Box>
            </Box>
            
            <Divider />
            
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nom d'utilisateur
                  </Typography>
                  <Typography variant="body1">
                    {user.username}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Dernière connexion
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.lastLogin)}
                  </Typography>
                </Grid>
                
                {user.role === 'agent' && user.sites && user.sites.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Sites accessibles
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {user.sites.map((site) => (
                        <Typography key={site} variant="body1">
                          • {site}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        {/* Change Password Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0, borderRadius: 1 }}>
            <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              Changer de Mot de Passe
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Mot de passe modifié avec succès
                </Alert>
              )}
              
              <TextField
                fullWidth
                margin="normal"
                label="Mot de passe actuel"
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handleInputChange}
                required
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Nouveau mot de passe"
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleInputChange}
                required
                helperText="Minimum 6 caractères"
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Confirmer le nouveau mot de passe"
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleInputChange}
                required
              />
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Changer le mot de passe'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Profile;