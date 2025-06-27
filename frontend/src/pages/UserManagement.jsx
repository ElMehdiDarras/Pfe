// src/pages/UserManagement.jsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Checkbox,
  ListItemText // Add this import for the dropdown menu items
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import { usePermission } from '../utils/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const UserManagement = () => {
  // Check if user has permission to manage users
  usePermission('MANAGE_USERS');
  const queryClient = useQueryClient();
  
  // UI states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Form values
  const [formValues, setFormValues] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: '',
    sites: []
  });
  
  // Reset password value
  const [newPassword, setNewPassword] = useState('');
  
  // Load users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/auth/users');
      return response.data;
    }
  });
  
  // Load sites
  const { data: sites, isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await api.get('/sites');
      return response.data;
    }
  });
  
  // Create user mutation - FIXED TO ENSURE EMAIL AND PHONE ARE ALWAYS INCLUDED
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      // Ensure email and phoneNumber are NEVER null or undefined
      const dataToSend = {
        ...userData,
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || ''
      };
      console.log('Sending user data:', dataToSend); // Add this for debugging
      return await api.post('/auth/users', dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setDialogOpen(false);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to create user');
    }
  });
  
  // Update user mutation - FIXED TO ENSURE EMAIL AND PHONE ARE ALWAYS INCLUDED
  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      // Ensure email and phoneNumber are always included and never undefined
      const dataToSend = {
        ...userData,
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || ''
      };
      console.log('Updating user with data:', dataToSend); // Add debugging log
      return await api.put(`/auth/users/${userData._id}`, dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setDialogOpen(false);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to update user');
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await api.delete(`/auth/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setConfirmDialogOpen(false);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      return await api.post(`/auth/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      setNewPassword('');
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to reset password');
    }
  });
  
  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle sites selection change (for multi-select dropdown)
  const handleSitesChange = (event) => {
    const { value } = event.target;
    setFormValues(prev => ({
      ...prev,
      sites: value
    }));
  };
  
  // Open dialog to add or edit user
  const handleDialogOpen = (type, user = null) => {
    setDialogType(type);
    setSelectedUser(user);
    setError(null);
    
    if (type === 'edit' && user) {
      setFormValues({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        password: '',
        confirmPassword: '',
        role: user.role,
        sites: user.sites || [],
        _id: user._id || user.id
      });
    } else {
      setFormValues({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'agent',
        sites: []
      });
    }
    
    setDialogOpen(true);
  };
  
  // Close dialog
  const handleDialogClose = () => {
    setDialogOpen(false);
    setError(null);
  };
  
  // Open confirm delete dialog
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setConfirmDialogOpen(true);
  };
  
  // Delete user
  const handleDeleteConfirm = () => {
    if (selectedUser && (selectedUser._id || selectedUser.id)) {
      deleteUserMutation.mutate(selectedUser._id || selectedUser.id);
    }
  };
  
  // Open reset password dialog
  const handleResetPasswordClick = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetPasswordDialogOpen(true);
  };
  
  // Reset user password
  const handleResetPasswordConfirm = () => {
    // Validate password
    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (selectedUser && (selectedUser._id || selectedUser.id)) {
      resetPasswordMutation.mutate({
        userId: selectedUser._id || selectedUser.id,
        newPassword
      });
    }
  };
  
  // Submit form
  const handleFormSubmit = () => {
    // Validate form
    if (!formValues.username || !formValues.firstName || !formValues.lastName || !formValues.role) {
      setError('Les champs Nom d\'utilisateur, Prénom, Nom et Rôle sont obligatoires');
      return;
    }
    
    // Validate password for new users
    if (dialogType === 'add') {
      if (!formValues.password || formValues.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      if (formValues.password !== formValues.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    }
    
    // Validate sites for agent role
    if (formValues.role === 'agent' && formValues.sites.length === 0) {
      setError('Un agent doit avoir au moins un site assigné');
      return;
    }
    
    // Email validation if provided
    if (formValues.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formValues.email)) {
        setError('Format d\'email invalide');
        return;
      }
    }
    
    // Submit the form
    if (dialogType === 'add') {
      createUserMutation.mutate(formValues);
    } else {
      updateUserMutation.mutate(formValues);
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
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
          Gestion des Utilisateurs
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('add')}
        >
          NOUVEL UTILISATEUR
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ borderRadius: 1 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Nom d'utilisateur</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Sites</TableCell>
                <TableCell>Dernière connexion</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user._id || user.id} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={formatRole(user.role)} 
                        size="small"
                        color={
                          user.role === 'administrator' ? 'primary' :
                          user.role === 'supervisor' ? 'secondary' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {user.role === 'agent' && user.sites && user.sites.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.sites.map(site => (
                            <Chip key={site} label={site} size="small" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {user.role === 'agent' ? 'Aucun site assigné' : 'Tous les sites'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.lastLogin)}</TableCell>
                    <TableCell>
                      <Tooltip title="Éditer">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDialogOpen('edit', user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Réinitialiser mot de passe">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleResetPasswordClick(user)}
                        >
                          <LockResetIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.username === 'admin'} // Prevent deletion of admin user
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              {!usersLoading && (!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'add' ? 'Nouvel Utilisateur' : 'Modifier Utilisateur'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom d'utilisateur"
                name="username"
                value={formValues.username}
                onChange={handleFormChange}
                required
                inputProps={{ maxLength: 32 }}
                disabled={dialogType === 'edit'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="role-label">Rôle</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formValues.role}
                  onChange={handleFormChange}
                  label="Rôle"
                >
                  <MenuItem value="administrator">Administrateur</MenuItem>
                  <MenuItem value="supervisor">Superviseur</MenuItem>
                  <MenuItem value="agent">Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prénom"
                name="firstName"
                value={formValues.firstName}
                onChange={handleFormChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom"
                name="lastName"
                value={formValues.lastName}
                onChange={handleFormChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="phoneNumber"
                value={formValues.phoneNumber}
                onChange={handleFormChange}
              />
            </Grid>
            
            {dialogType === 'add' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mot de passe"
                    name="password"
                    type="password"
                    value={formValues.password}
                    onChange={handleFormChange}
                    required
                    helperText="Minimum 6 caractères"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    type="password"
                    value={formValues.confirmPassword}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
              </>
            )}
            
            {/* REPLACED SITE SELECTION GRID WITH DROPDOWN MENU */}
            {formValues.role === 'agent' && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="sites-checkbox-label">Sites accessibles</InputLabel>
                  <Select
                    labelId="sites-checkbox-label"
                    multiple
                    value={formValues.sites}
                    onChange={handleSitesChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((siteName) => (
                          <Chip key={siteName} label={siteName} size="small" />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {sitesLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Chargement des sites...
                      </MenuItem>
                    ) : sites?.length > 0 ? (
                      sites.map((site) => (
                        <MenuItem key={site._id || site.id} value={site.name}>
                          <Checkbox checked={formValues.sites.includes(site.name)} />
                          <ListItemText primary={site.name} />
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Aucun site disponible</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            color="primary"
            disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
          >
            {createUserMutation.isLoading || updateUserMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : dialogType === 'add' ? (
              'Ajouter'
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.username}" ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteUserMutation.isLoading}
          >
            {deleteUserMutation.isLoading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)}>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          
          <Typography sx={{ mb: 2, mt: 1 }}>
            Entrez un nouveau mot de passe pour l'utilisateur "{selectedUser?.username}".
          </Typography>
          
          <TextField
            fullWidth
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 6 caractères"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleResetPasswordConfirm}
            variant="contained"
            color="primary"
            disabled={resetPasswordMutation.isLoading}
          >
            {resetPasswordMutation.isLoading ? <CircularProgress size={24} /> : 'Réinitialiser'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagement;