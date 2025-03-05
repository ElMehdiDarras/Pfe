// src/components/UserProfile.js
import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Divider, 
  Button, 
  TextField, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert
} from '@mui/material';
import { AccountCircle, Security, Schedule, SupervisorAccount } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRoleName = (role) => {
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

  const handleOpenPasswordDialog = () => {
    setOpenPasswordDialog(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
  };

  const handlePasswordChange = async () => {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/change-password`, {
        currentPassword,
        newPassword
      });
      
      setSuccess('Mot de passe changé avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClosePasswordDialog();
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.response?.data?.message || 'Échec du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Profil Utilisateur
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountCircle sx={{ fontSize: 64, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">{currentUser?.fullName || currentUser?.username}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              <SupervisorAccount sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              {getRoleName(currentUser?.role)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Nom d'utilisateur
            </Typography>
            <Typography variant="body1" gutterBottom>
              {currentUser?.username}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1" gutterBottom>
              {currentUser?.email || 'Non renseigné'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Dernière connexion
            </Typography>
            <Typography variant="body1" gutterBottom>
              <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              {formatDate(currentUser?.lastLogin) || 'Maintenant'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Sites assignés
            </Typography>
            <Typography variant="body1" gutterBottom>
              {currentUser?.sites?.length ? (
                currentUser.sites.join(', ')
              ) : (
                currentUser?.role === 'administrator' || currentUser?.role === 'supervisor' ? 
                'Tous les sites' : 'Aucun site assigné'
              )}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<Security />}
            onClick={handleOpenPasswordDialog}
          >
            Changer de mot de passe
          </Button>
          
          <Button 
            variant="outlined" 
            color="error"
            onClick={logout}
          >
            Déconnexion
          </Button>
        </Box>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Changer de mot de passe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Pour changer votre mot de passe, veuillez entrer votre mot de passe actuel
            et votre nouveau mot de passe.
          </DialogContentText>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
              {success}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            label="Mot de passe actuel"
            type="password"
            fullWidth
            variant="outlined"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            required
            sx={{ mt: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Nouveau mot de passe"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            required
          />
          
          <TextField
            margin="dense"
            label="Confirmer le nouveau mot de passe"
            type="password"
            fullWidth
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            color="primary" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Modification...' : 'Modifier'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile;