// src/pages/Configuration.jsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonIcon from '@mui/icons-material/Person';
import { useSites } from '../hooks/useSites';
import { useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios'; // Use your existing axios instance

const Configuration = () => {
  const [tabValue, setTabValue] = useState(0);
  const { data: sites, isLoading, error } = useSites();
  const queryClient = useQueryClient();
  
  // Dialog states for Sites tab
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('add');
  const [selectedSite, setSelectedSite] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    vlan: '',
    ipRange: '',
    location: ''
  });
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Form error state
  const [formError, setFormError] = useState(null);

  // Boxes Tab states and handlers
  const [selectedSiteForBoxes, setSelectedSiteForBoxes] = useState('');
  const [boxFormOpen, setBoxFormOpen] = useState(false);
  const [boxFormValues, setBoxFormValues] = useState({
    name: '',
    ip: '',
    port: 502, // Default Modbus TCP port
  });
  const [boxError, setBoxError] = useState(null);
  const [isSubmittingBox, setIsSubmittingBox] = useState(false);

  // Equipment Tab states
  const [selectedSiteForEquipment, setSelectedSiteForEquipment] = useState('');
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [equipmentFormValues, setEquipmentFormValues] = useState({
    name: '',
    type: '',
    boxId: '',
    pinId: ''
  });
  const [equipmentError, setEquipmentError] = useState(null);
  const [isSubmittingEquipment, setIsSubmittingEquipment] = useState(false);

  // User Tab states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogType, setUserDialogType] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormValues, setUserFormValues] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    role: 'agent',
    sites: []
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [userError, setUserError] = useState(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userConfirmDialogOpen, setUserConfirmDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Basic tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({queryKey: ['sites']});
  };

  // SITES TAB HANDLERS
  const handleDialogOpen = (type, site) => {
    setDialogType(type);
    setFormError(null);
    
    if (type === 'edit' && site) {
      setSelectedSite(site);
      setFormValues({
        name: site.name,
        vlan: site.vlan || '',
        ipRange: site.ipRange || '',
        location: site.location || ''
      });
    } else {
      setFormValues({
        name: '',
        vlan: '',
        ipRange: '',
        location: ''
      });
    }
    
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedSite(null);
    setFormError(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async () => {
    // Basic validation
    if (!formValues.name || !formValues.location) {
      setFormError('Le nom et l\'emplacement sont obligatoires');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      if (dialogType === 'add') {
        // Create new site
        await axios.post('/sites', formValues);
        console.log('Site created successfully');
      } else {
        // Update existing site
        const siteId = selectedSite._id; // Using only _id for MongoDB
        
        if (!siteId) {
          console.error('Cannot find valid MongoDB _id for site:', selectedSite);
          setFormError('Impossible de modifier ce site: identifiant invalide');
          setIsSubmitting(false);
          return;
        }
        
        console.log('Updating site with ID:', siteId);
        
        await axios.put(`/sites/${siteId}`, formValues);
        console.log('Site updated successfully');
      }
      
      // Refresh data
      queryClient.invalidateQueries({queryKey: ['sites']});
      handleDialogClose();
    } catch (err) {
      console.error('Error saving site:', err);
      const errorMessage = err.response?.data?.error || 'Une erreur est survenue lors de l\'enregistrement du site';
      setFormError(`${errorMessage} (${err.message})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (site) => {
    setSelectedSite(site);
    setConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSite) return;
    
    setIsSubmitting(true);
    
    try {
      // Using MongoDB _id specifically
      const siteId = selectedSite._id;
      
      if (!siteId) {
        console.error('Cannot find valid MongoDB _id for site:', selectedSite);
        setFormError('Impossible de supprimer ce site: identifiant invalide');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Deleting site with ID:', siteId);
      
      await axios.delete(`/sites/${siteId}`);
      console.log('Site deleted successfully');
      
      // Refresh data
      queryClient.invalidateQueries({queryKey: ['sites']});
      setConfirmDialogOpen(false);
      setSelectedSite(null);
    } catch (err) {
      console.error('Error deleting site:', err);
      const errorMessage = err.response?.data?.error || 'Une erreur est survenue lors de la suppression du site';
      setFormError(`${errorMessage} (${err.message})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // BOXES TAB HANDLERS
  const handleSiteSelectionForBoxes = (event) => {
    setSelectedSiteForBoxes(event.target.value);
  };

  const handleBoxFormOpen = () => {
    setBoxFormValues({
      name: '',
      ip: '',
      port: 502
    });
    setBoxError(null);
    setBoxFormOpen(true);
  };

  const handleBoxFormClose = () => {
    setBoxFormOpen(false);
    setBoxError(null);
  };

  const handleBoxFormChange = (e) => {
    const { name, value } = e.target;
    // For port field, ensure it's a number
    if (name === 'port') {
      const numValue = parseInt(value);
      setBoxFormValues(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? '' : numValue
      }));
    } else {
      setBoxFormValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBoxFormSubmit = async () => {
    // Validate form
    if (!boxFormValues.name || !boxFormValues.ip) {
      setBoxError('Le nom et l\'adresse IP sont obligatoires');
      return;
    }

    // Validate IP format (simple validation)
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipRegex.test(boxFormValues.ip)) {
      setBoxError('Format d\'adresse IP invalide');
      return;
    }

    // Find the selected site
    const site = sites?.find(s => s._id === selectedSiteForBoxes);
    if (!site) {
      setBoxError('Site non trouvé');
      return;
    }
    
    setIsSubmittingBox(true);
    setBoxError(null);
    
    try {
      // Add box to the selected site
      await axios.post(`/sites/${selectedSiteForBoxes}/boxes`, boxFormValues);
      
      // Refresh data
      queryClient.invalidateQueries({queryKey: ['sites']});
      handleBoxFormClose();
      
    } catch (err) {
      console.error('Error adding box:', err);
      setBoxError(err.response?.data?.error || 'Une erreur est survenue lors de l\'ajout de la box');
    } finally {
      setIsSubmittingBox(false);
    }
  };

  const handleDeleteBox = async (boxIndex) => {
    if (!selectedSiteForBoxes) return;
    
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette box ?');
    if (!confirmed) return;
    
    try {
      await axios.delete(`/sites/${selectedSiteForBoxes}/boxes/${boxIndex}`);
      queryClient.invalidateQueries({queryKey: ['sites']});
    } catch (err) {
      console.error('Error deleting box:', err);
      alert('Erreur lors de la suppression: ' + (err.response?.data?.error || err.message));
    }
  };

  // EQUIPMENT TAB HANDLERS
  const handleSiteSelectionForEquipment = (event) => {
    setSelectedSiteForEquipment(event.target.value);
  };

  const handleEquipmentFormOpen = () => {
    setEquipmentFormValues({
      name: '',
      type: '',
      boxId: '',
      pinId: ''
    });
    setEquipmentError(null);
    setEquipmentFormOpen(true);
  };

  const handleEquipmentFormClose = () => {
    setEquipmentFormOpen(false);
    setEquipmentError(null);
  };

  const handleEquipmentFormChange = (e) => {
    const { name, value } = e.target;
    setEquipmentFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEquipmentFormSubmit = async () => {
    // Validate form
    if (!equipmentFormValues.name || !equipmentFormValues.type) {
      setEquipmentError('Le nom et le type sont obligatoires');
      return;
    }

    // Find the selected site
    const site = sites?.find(s => s._id === selectedSiteForEquipment);
    if (!site) {
      setEquipmentError('Site non trouvé');
      return;
    }
    
    setIsSubmittingEquipment(true);
    setEquipmentError(null);
    
    try {
      // Add equipment to the selected site
      await axios.post(`/sites/${selectedSiteForEquipment}/equipment`, equipmentFormValues);
      
      // Refresh data
      queryClient.invalidateQueries({queryKey: ['sites']});
      handleEquipmentFormClose();
      
    } catch (err) {
      console.error('Error adding equipment:', err);
      setEquipmentError(err.response?.data?.error || 'Une erreur est survenue lors de l\'ajout de l\'équipement');
    } finally {
      setIsSubmittingEquipment(false);
    }
  };

  const handleDeleteEquipment = async (equipIndex) => {
    if (!selectedSiteForEquipment) return;
    
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?');
    if (!confirmed) return;
    
    try {
      await axios.delete(`/sites/${selectedSiteForEquipment}/equipment/${equipIndex}`);
      queryClient.invalidateQueries({queryKey: ['sites']});
    } catch (err) {
      console.error('Error deleting equipment:', err);
      alert('Erreur lors de la suppression: ' + (err.response?.data?.error || err.message));
    }
  };

  // USERS TAB HANDLERS
  // Load users from API when the tab is selected
  React.useEffect(() => {
    if (tabValue === 3) {
      loadUsers();
    }
  }, [tabValue]);

  // Load users from backend
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUserError(null);
    try {
      const response = await axios.get('/auth/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error loading users:', err);
      setUserError('Erreur lors du chargement des utilisateurs: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Open user dialog for add/edit
  const handleUserDialogOpen = (type = 'add', user = null) => {
    setUserDialogType(type);
    setSelectedUser(user);
    setUserError(null);
    
    if (type === 'edit' && user) {
      // Edit existing user
      setUserFormValues({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        confirmPassword: '',
        role: user.role,
        sites: user.sites || []
      });
    } else {
      // New user defaults
      setUserFormValues({
        username: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
        role: 'agent',
        sites: []
      });
    }
    
    setUserDialogOpen(true);
  };

  // Close user dialog
  const handleUserDialogClose = () => {
    setUserDialogOpen(false);
    setSelectedUser(null);
    setUserError(null);
  };

  // Handle change in user form fields
  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle site selection for agent users
  const handleUserSitesChange = (event) => {
    const { value } = event.target;
    setUserFormValues(prev => ({
      ...prev,
      sites: value
    }));
  };

  // Submit user form (add/edit)
  const handleUserFormSubmit = async () => {
    // Basic validation
    if (!userFormValues.username || !userFormValues.firstName || !userFormValues.lastName) {
      setUserError('Tous les champs marqués * sont obligatoires');
      return;
    }
    
    // Validate password for new users
    if (userDialogType === 'add') {
      if (!userFormValues.password) {
        setUserError('Le mot de passe est obligatoire pour les nouveaux utilisateurs');
        return;
      }
      
      if (userFormValues.password.length < 6) {
        setUserError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      if (userFormValues.password !== userFormValues.confirmPassword) {
        setUserError('Les mots de passe ne correspondent pas');
        return;
      }
    }
    
    // Validate site selection for agents
    if (userFormValues.role === 'agent' && (!userFormValues.sites || userFormValues.sites.length === 0)) {
      setUserError('Les agents doivent avoir au moins un site assigné');
      return;
    }
    
    setIsSubmittingUser(true);
    setUserError(null);
    
    try {
      if (userDialogType === 'add') {
        // Create new user
        await axios.post('/auth/users', {
          username: userFormValues.username,
          password: userFormValues.password,
          firstName: userFormValues.firstName,
          lastName: userFormValues.lastName,
          role: userFormValues.role,
          sites: userFormValues.role === 'agent' ? userFormValues.sites : []
        });
      } else if (selectedUser) {
        // Update existing user
        await axios.put(`/auth/users/${selectedUser._id}`, {
          firstName: userFormValues.firstName,
          lastName: userFormValues.lastName,
          role: userFormValues.role,
          sites: userFormValues.role === 'agent' ? userFormValues.sites : []
        });
      }
      
      // Reload users
      loadUsers();
      handleUserDialogClose();
    } catch (err) {
      console.error('Error saving user:', err);
      setUserError(err.response?.data?.error || 'Une erreur est survenue lors de l\'enregistrement de l\'utilisateur');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Open confirm delete dialog for user
  const handleDeleteUserClick = (user) => {
    setSelectedUser(user);
    setUserConfirmDialogOpen(true);
  };

  // Delete user after confirmation
  const handleDeleteUserConfirm = async () => {
    if (!selectedUser) return;
    
    setIsSubmittingUser(true);
    
    try {
      await axios.delete(`/auth/users/${selectedUser._id}`);
      // Reload users
      loadUsers();
      setUserConfirmDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setUserError(err.response?.data?.error || 'Une erreur est survenue lors de la suppression de l\'utilisateur');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Open reset password dialog
  const handleResetPasswordClick = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setUserError(null);
    setResetPasswordDialogOpen(true);
  };

  // Reset user password
  const handleResetPasswordConfirm = async () => {
    // Validate password
    if (!newPassword || newPassword.length < 6) {
      setUserError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setIsSubmittingUser(true);
    setUserError(null);
    
    try {
      await axios.post(`/auth/users/${selectedUser._id}/reset-password`, { newPassword });
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      setUserError(err.response?.data?.error || 'Une erreur est survenue lors de la réinitialisation du mot de passe');
    } finally {
      setIsSubmittingUser(false);
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
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Helper function for equipment status chips
  const getEquipmentStatusChip = (status) => {
    switch (status) {
      case 'CRITICAL':
        return <Chip label="CRITICAL" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />;
      case 'MAJOR':
        return <Chip label="MAJOR" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />;
      case 'WARNING':
        return <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ffeb3b', color: 'black' }} />;
      case 'OK':
        return <Chip label="OK" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />;
      default:
        return <Chip label={status || 'UNKNOWN'} size="small" />;
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>Configuration</Typography>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 1 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="SITES" />
          <Tab label="BOXES" />
          <Tab label="EQUIPEMENTS" />

        </Tabs>

        <Box sx={{ p: 0 }}>
          {/* Sites Tab */}
          {tabValue === 0 && (
            <>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleDialogOpen('add')}
                  sx={{ 
                    bgcolor: '#1976d2',
                    '&:hover': {
                      bgcolor: '#1565c0'
                    }
                  }}
                >
                  AJOUTER UN SITE
                </Button>
              </Box>

              {error ? (
                <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
                  {error instanceof Error ? error.message : 'Erreur de chargement des sites'}
                </Alert>
              ) : isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Nom du Site</TableCell>
                        <TableCell>VLAN</TableCell>
                        <TableCell>Adresse IP</TableCell>
                        <TableCell>Emplacement</TableCell>
                        <TableCell>Nombre de Boxes</TableCell>
                        <TableCell>Nombre d'Équipements</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sites?.map((site) => (
                        <TableRow key={site.id || site._id} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                          <TableCell>{site.name}</TableCell>
                          <TableCell>{site.vlan || '-'}</TableCell>
                          <TableCell>{site.ipRange}</TableCell>
                          <TableCell>{site.location}</TableCell>
                          <TableCell>{site.boxes?.length || 0}</TableCell>
                          <TableCell>{site.equipment?.length || 0}</TableCell>
                          <TableCell>
                            <Tooltip title="Éditer">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDialogOpen('edit', site)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(site)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sites?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Aucun site trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* Boxes Tab */}
          {tabValue === 1 && (
            <>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="site-select-label">Site</InputLabel>
                  <Select
                    labelId="site-select-label"
                    value={selectedSiteForBoxes}
                    onChange={handleSiteSelectionForBoxes}
                    label="Site"
                  >
                    <MenuItem value="">
                      <em>Sélectionner un site</em>
                    </MenuItem>
                    {sites?.map((site) => (
                      <MenuItem key={site._id} value={site._id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleBoxFormOpen}
                  disabled={!selectedSiteForBoxes}
                  sx={{ 
                    bgcolor: '#1976d2',
                    '&:hover': {
                      bgcolor: '#1565c0'
                    }
                  }}
                >
                  AJOUTER UNE BOX
                </Button>
              </Box>

              {selectedSiteForBoxes ? (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Adresse IP</TableCell>
                        <TableCell>Port</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Dernière vue</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sites?.find(site => site._id === selectedSiteForBoxes)?.boxes?.map((box, index) => (
                        <TableRow key={box._id || index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                          <TableCell>{box.name}</TableCell>
                          <TableCell>{box.ip}</TableCell>
                          <TableCell>{box.port || 502}</TableCell>
                          <TableCell>
                            <Chip 
                              label={box.status || 'UP'} 
                              size="small"
                              color={box.status === 'DOWN' ? 'error' : 'success'} 
                            />
                          </TableCell>
                          <TableCell>
                            {box.lastSeen ? new Date(box.lastSeen).toLocaleString('fr-FR') : 'Jamais'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteBox(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!sites?.find(site => site._id === selectedSiteForBoxes)?.boxes || 
                        sites?.find(site => site._id === selectedSiteForBoxes)?.boxes.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            Aucune box trouvée pour ce site
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Veuillez sélectionner un site pour afficher ses boxes
                  </Typography>
                </Box>
              )}
              
              {/* Add Box Dialog */}
              <Dialog open={boxFormOpen} onClose={handleBoxFormClose} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter une Box</DialogTitle>
                <DialogContent>
                  {boxError && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                      {boxError}
                    </Alert>
                  )}
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nom de la Box"
                        name="name"
                        value={boxFormValues.name}
                        onChange={handleBoxFormChange}
                        variant="outlined"
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Adresse IP"
                        name="ip"
                        value={boxFormValues.ip}
                        onChange={handleBoxFormChange}
                        variant="outlined"
                        size="small"
                        required
                        placeholder="192.168.1.100"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Port"
                        name="port"
                        type="number"
                        value={boxFormValues.port}
                        onChange={handleBoxFormChange}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 1, max: 65535 }}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleBoxFormClose} color="inherit">
                    Annuler
                  </Button>
                  <Button
                    onClick={handleBoxFormSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isSubmittingBox}
                  >
                    {isSubmittingBox ? <CircularProgress size={24} /> : 'Ajouter'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
          
          {/* Equipment Tab */}
          {tabValue === 2 && (
            <>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="site-select-equipment-label">Site</InputLabel>
                  <Select
                    labelId="site-select-equipment-label"
                    value={selectedSiteForEquipment}
                    onChange={handleSiteSelectionForEquipment}
                    label="Site"
                  >
                    <MenuItem value="">
                      <em>Sélectionner un site</em>
                    </MenuItem>
                    {sites?.map((site) => (
                      <MenuItem key={site._id} value={site._id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleEquipmentFormOpen}
                  disabled={!selectedSiteForEquipment}
                  sx={{ 
                    bgcolor: '#1976d2',
                    '&:hover': {
                      bgcolor: '#1565c0'
                    }
                  }}
                >
                  AJOUTER UN ÉQUIPEMENT
                </Button>
              </Box>

              {selectedSiteForEquipment ? (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Box ID</TableCell>
                        <TableCell>Pin ID</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sites?.find(site => site._id === selectedSiteForEquipment)?.equipment?.map((equip, index) => (
                        <TableRow key={equip._id || index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                          <TableCell>{equip.name}</TableCell>
                          <TableCell>{equip.type}</TableCell>
                          <TableCell>{getEquipmentStatusChip(equip.status)}</TableCell>
                          <TableCell>{equip.boxId || '-'}</TableCell>
                          <TableCell>{equip.pinId || '-'}</TableCell>
                          <TableCell>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteEquipment(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!sites?.find(site => site._id === selectedSiteForEquipment)?.equipment || 
                        sites?.find(site => site._id === selectedSiteForEquipment)?.equipment.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            Aucun équipement trouvé pour ce site
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Veuillez sélectionner un site pour afficher ses équipements
                  </Typography>
                </Box>
              )}
              
              {/* Add Equipment Dialog */}
              <Dialog open={equipmentFormOpen} onClose={handleEquipmentFormClose} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter un Équipement</DialogTitle>
                <DialogContent>
                  {equipmentError && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                      {equipmentError}
                    </Alert>
                  )}
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nom de l'équipement"
                        name="name"
                        value={equipmentFormValues.name}
                        onChange={handleEquipmentFormChange}
                        variant="outlined"
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel id="equipment-type-label">Type d'équipement</InputLabel>
                        <Select
                          labelId="equipment-type-label"
                          name="type"
                          value={equipmentFormValues.type}
                          onChange={handleEquipmentFormChange}
                          label="Type d'équipement"
                        >
                          <MenuItem value="Armoire Électrique">Armoire Électrique</MenuItem>
                          <MenuItem value="Climatiseur">Climatiseur</MenuItem>
                          <MenuItem value="Thermostat">Thermostat</MenuItem>
                          <MenuItem value="Centrale Incendie">Centrale Incendie</MenuItem>
                          <MenuItem value="Groupe Électrogène">Groupe Électrogène</MenuItem>
                          <MenuItem value="Autre">Autre</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="box-id-label">Box</InputLabel>
                        <Select
                          labelId="box-id-label"
                          name="boxId"
                          value={equipmentFormValues.boxId}
                          onChange={handleEquipmentFormChange}
                          label="Box"
                        >
                          <MenuItem value="">
                            <em>Aucune</em>
                          </MenuItem>
                          {sites?.find(site => site._id === selectedSiteForEquipment)?.boxes?.map((box) => (
                            <MenuItem key={box._id} value={box._id}>
                              {box.name} ({box.ip})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Pin ID"
                        name="pinId"
                        value={equipmentFormValues.pinId}
                        onChange={handleEquipmentFormChange}
                        variant="outlined"
                        size="small"
                        placeholder="PIN_01"
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleEquipmentFormClose} color="inherit">
                    Annuler
                  </Button>
                  <Button
                    onClick={handleEquipmentFormSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isSubmittingEquipment}
                  >
                    {isSubmittingEquipment ? <CircularProgress size={24} /> : 'Ajouter'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
          
          {/* Users Tab */}
          {tabValue === 3 && (
            <>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Gestion des utilisateurs</Typography>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleUserDialogOpen()}
                  sx={{ 
                    bgcolor: '#1976d2',
                    '&:hover': {
                      bgcolor: '#1565c0'
                    }
                  }}
                >
                  NOUVEL UTILISATEUR
                </Button>
              </Box>

              {userError && (
                <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
                  {userError}
                </Alert>
              )}

              {isLoadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Nom d'utilisateur</TableCell>
                        <TableCell>Nom</TableCell>
                        <TableCell>Prénom</TableCell>
                        <TableCell>Rôle</TableCell>
                        <TableCell>Sites assignés</TableCell>
                        <TableCell>Dernière connexion</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
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
                                onClick={() => handleUserDialogOpen('edit', user)}
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
                                onClick={() => handleDeleteUserClick(user)}
                                disabled={user.username === 'admin'} // Prevent deletion of admin user
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!isLoadingUsers && users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Add/Edit User Dialog */}
              <Dialog open={userDialogOpen} onClose={handleUserDialogClose} maxWidth="md" fullWidth>
                <DialogTitle>
                  {userDialogType === 'add' ? 'Nouvel Utilisateur' : 'Modifier Utilisateur'}
                </DialogTitle>
                <DialogContent>
                  {userError && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                      {userError}
                    </Alert>
                  )}
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nom d'utilisateur"
                        name="username"
                        value={userFormValues.username}
                        onChange={handleUserFormChange}
                        required
                        inputProps={{ maxLength: 32 }}
                        disabled={userDialogType === 'edit'}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required>
                        <InputLabel id="role-label">Rôle</InputLabel>
                        <Select
                          labelId="role-label"
                          name="role"
                          value={userFormValues.role}
                          onChange={handleUserFormChange}
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
                        value={userFormValues.firstName}
                        onChange={handleUserFormChange}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nom"
                        name="lastName"
                        value={userFormValues.lastName}
                        onChange={handleUserFormChange}
                        required
                      />
                    </Grid>
                    
                    {userDialogType === 'add' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Mot de passe"
                            name="password"
                            type="password"
                            value={userFormValues.password}
                            onChange={handleUserFormChange}
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
                            value={userFormValues.confirmPassword}
                            onChange={handleUserFormChange}
                            required
                          />
                        </Grid>
                      </>
                    )}
                    
                    {userFormValues.role === 'agent' && (
                      <Grid item xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel id="sites-label">Sites accessibles</InputLabel>
                          <Select
                            labelId="sites-label"
                            multiple
                            name="sites"
                            value={userFormValues.sites}
                            onChange={handleUserSitesChange}
                            label="Sites accessibles"
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                  <Chip key={value} label={value} size="small" />
                                ))}
                              </Box>
                            )}
                          >
                            {sites?.map((site) => (
                              <MenuItem key={site._id} value={site.name}>
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
                  <Button onClick={handleUserDialogClose} color="inherit">
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUserFormSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isSubmittingUser}
                  >
                    {isSubmittingUser ? (
                      <CircularProgress size={24} />
                    ) : userDialogType === 'add' ? (
                      'Ajouter'
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </DialogActions>
              </Dialog>
              
              {/* Reset Password Dialog */}
              <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)}>
                <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                <DialogContent>
                  {userError && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                      {userError}
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
                    disabled={isSubmittingUser}
                  >
                    {isSubmittingUser ? <CircularProgress size={24} /> : 'Réinitialiser'}
                  </Button>
                </DialogActions>
              </Dialog>
              
              {/* Confirm Delete User Dialog */}
              <Dialog open={userConfirmDialogOpen} onClose={() => setUserConfirmDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                  <Typography>
                    Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.username}" ? Cette action est irréversible.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setUserConfirmDialogOpen(false)} color="inherit">
                    Annuler
                  </Button>
                  <Button
                    onClick={handleDeleteUserConfirm}
                    variant="contained"
                    color="error"
                    disabled={isSubmittingUser}
                  >
                    {isSubmittingUser ? <CircularProgress size={24} /> : 'Supprimer'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
          
          {/* Notifications Tab */}
          {tabValue === 4 && (
            <Box sx={{ p: 3 }}>
              <Typography>Configuration des Notifications</Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Cette fonctionnalité sera disponible dans une future mise à jour. Elle permettra de configurer des alertes par email et par SMS en cas d'alarmes critiques.
              </Alert>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Add/Edit Site Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'add' ? 'Ajouter un Site' : 'Modifier le Site'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du Site"
                name="name"
                value={formValues.name}
                onChange={handleFormChange}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VLAN"
                name="vlan"
                value={formValues.vlan}
                onChange={handleFormChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plage IP"
                name="ipRange"
                value={formValues.ipRange}
                onChange={handleFormChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emplacement"
                name="location"
                value={formValues.location}
                onChange={handleFormChange}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : (dialogType === 'add' ? 'Ajouter' : 'Enregistrer')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le site "{selectedSite?.name}" ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Configuration;