// src/pages/UserManagement.jsx
import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import { usePermission } from '../utils/permissions';

const UserManagement = () => {
  // Check if user has permission to manage users
  usePermission('MANAGE_USERS');
  
  // Mock users data - in a real app, this would come from an API
  const [users, setUsers] = useState([
    { 
      id: '1', 
      username: 'admin', 
      firstName: 'Admin', 
      lastName: 'User', 
      role: 'administrator',
      sites: [],
      lastLogin: new Date().toISOString(), 
      active: true 
    },
    { 
      id: '2', 
      username: 'supervisor', 
      firstName: 'Super', 
      lastName: 'Visor', 
      role: 'supervisor',
      sites: [],
      lastLogin: new Date().toISOString(), 
      active: true 
    },
    { 
      id: '3', 
      username: 'agent1', 
      firstName: 'Agent', 
      lastName: 'One', 
      role: 'agent',
      sites: ['Rabat-Hay NAHDA'],
      lastLogin: new Date().toISOString(), 
      active: true 
    },
    { 
      id: '4', 
      username: 'agent2', 
      firstName: 'Agent', 
      lastName: 'Two', 
      role: 'agent',
      sites: ['Rabat-Soekarno', 'Casa-Nations Unies'],
      lastLogin: new Date().toISOString(), 
      active: true 
    }
  ]);
  
  // Sites data for select dropdown
  const [sites, setSites] = useState([
    { id: '1', name: 'Rabat-Hay NAHDA' },
    { id: '2', name: 'Rabat-Soekarno' },
    { id: '3', name: 'Casa-Nations Unies' }
  ]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  
  // Form values
  const [formValues, setFormValues] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    role: '',
    sites: []
  });
  
  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle sites selection change
  const handleSitesChange = (event) => {
    const { value } = event.target;
    setFormValues(prev => ({
      ...prev,
      sites: value
    }));
  };
  
  // Reset password value
  const [newPassword, setNewPassword] = useState('');
  
  // Open dialog to add or edit user
  const handleDialogOpen = (type, user = null) => {
    setDialogType(type);
    setSelectedUser(user);
    
    if (type === 'edit' && user) {
      setFormValues({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        confirmPassword: '',
        role: user.role,
        sites: user.sites || []
      });
    } else {
      setFormValues({
        username: '',
        firstName: '',
        lastName: '',
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
    // Simulate API call
    setLoading(true);
    
    // In a real app, you would call API to delete user
    setTimeout(() => {
      setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id));
      setConfirmDialogOpen(false);
      setSelectedUser(null);
      setLoading(false);
    }, 500);
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
    
    // Simulate API call
    setLoading(true);
    
    // In a real app, you would call API to reset password
    setTimeout(() => {
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
      setLoading(false);
      setError(null);
    }, 500);
  };
  
  // Submit form
  const handleFormSubmit = () => {
    // Validate form
    if (!formValues.username || !formValues.firstName || !formValues.lastName || !formValues.role) {
      setError('Tous les champs sont obligatoires');
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
    
    // Simulate API call
    setLoading(true);
    
    setTimeout(() => {
      if (dialogType === 'add') {
        // Simulate adding new user
        const newUser = {
          id: String(users.length + 1),
          username: formValues.username,
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          role: formValues.role,
          sites: formValues.role === 'agent' ? formValues.sites : [],
          lastLogin: null,
          active: true
        };
        
        setUsers(prevUsers => [...prevUsers, newUser]);
      } else {
        // Simulate updating user
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id 
              ? { 
                  ...user, 
                  username: formValues.username,
                  firstName: formValues.firstName,
                  lastName: formValues.lastName,
                  role: formValues.role,
                  sites: formValues.role === 'agent' ? formValues.sites : user.sites
                } 
              : user
          )
        );
      }
      
      setDialogOpen(false);
      setLoading(false);
      setError(null);
    }, 500);
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
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
              
              {!loading && users.length === 0 && (
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
            
            {formValues.role === 'agent' && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="sites-label">Sites accessibles</InputLabel>
                  <Select
                    labelId="sites-label"
                    multiple
                    value={formValues.sites}
                    onChange={handleSitesChange}
                    label="Sites accessibles"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {sites.map((site) => (
                      <MenuItem key={site.id} value={site.name}>
                        {site.name}
                      </MenuItem>
                    ))}
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
            disabled={loading}
          >
            {loading ? (
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
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
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
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Réinitialiser'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagement;