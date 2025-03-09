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
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSites } from '../hooks/useSites';
import { useQueryClient } from '@tanstack/react-query';

const Configuration = () => {
  const [tabValue, setTabValue] = useState(0);
  const { data: sites, isLoading, error } = useSites();
  const queryClient = useQueryClient();
  
  // Dialog states
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({queryKey: ['sites']});
  };

  const handleDialogOpen = (type, site) => {
    setDialogType(type);
    
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
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = () => {
    // In a real application, you would implement API calls to save the data
    console.log('Form data to submit:', formValues);
    alert(`Site ${dialogType === 'add' ? 'ajouté' : 'modifié'} avec succès (simulé)`);
    
    handleDialogClose();
    // In a real application, you would refetch the data or update the cache
    // queryClient.invalidateQueries({queryKey: ['sites']});
  };

  const handleDeleteClick = (site) => {
    setSelectedSite(site);
    setConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // In a real application, you would implement API calls to delete the site
    console.log('Deleting site:', selectedSite);
    alert(`Site ${selectedSite.name} supprimé avec succès (simulé)`);
    
    setConfirmDialogOpen(false);
    setSelectedSite(null);
    // In a real application, you would refetch the data or update the cache
    // queryClient.invalidateQueries({queryKey: ['sites']});
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
          <Tab label="UTILISATEURS" />
          <Tab label="NOTIFICATIONS" />
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
                        <TableRow key={site.id} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
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

          {/* Other tabs would be implemented similarly */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography>Configuration des Boxes</Typography>
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography>Configuration des Équipements</Typography>
            </Box>
          )}
          
          {tabValue === 3 && (
            <Box sx={{ p: 3 }}>
              <Typography>Gestion des Utilisateurs</Typography>
            </Box>
          )}
          
          {tabValue === 4 && (
            <Box sx={{ p: 3 }}>
              <Typography>Configuration des Notifications</Typography>
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
          >
            {dialogType === 'add' ? 'Ajouter' : 'Enregistrer'}
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
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Configuration;