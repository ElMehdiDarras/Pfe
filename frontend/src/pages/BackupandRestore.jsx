import React, { useState, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BackupIcon from '@mui/icons-material/Backup';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/axios';

const BackupandRestore = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';
  const fileInputRef = useRef(null);
  
  // Retention period state
  const [retentionPeriod, setRetentionPeriod] = useState('7');
  const [confirmDialog, setConfirmDialog] = useState(false);
  
  // Backup state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [backupError, setBackupError] = useState(null);
  
  // Restore state
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [restoreDetails, setRestoreDetails] = useState(null);
  const [restoreProgress, setRestoreProgress] = useState(0);
  
  // Fetch current retention settings
  const { data: settings, isLoading: settingsLoading, refetch } = useQuery({
    queryKey: ['retentionSettings'],
    queryFn: async () => {
      const response = await api.get('/settings/retention');
      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.retentionPeriod) {
        setRetentionPeriod(data.retentionPeriod.toString());
      }
    },
    onError: (error) => {
      console.error('Error fetching retention settings:', error);
    }
  });
  
  // Update retention settings mutation
  const updateRetentionMutation = useMutation({
    mutationFn: async (period) => {
      return await api.put('/settings/retention', { retentionPeriod: period });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      refetch(); // Refresh the data
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      setSaveError(error.response?.data?.error || 'Failed to update retention period');
      setTimeout(() => setSaveError(null), 5000);
    }
  });
  
  // Database restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (formData) => {
      return await api.post('/settings/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setRestoreProgress(percentCompleted);
        },
      });
    },
    onSuccess: (response) => {
      setRestoreSuccess(true);
      setRestoreDetails(response.data);
      setRestoreInProgress(false);
      setTimeout(() => {
        setRestoreSuccess(false);
        setRestoreDetails(null);
      }, 5000);
    },
    onError: (error) => {
      setRestoreError(error.response?.data?.error || 'Failed to restore database');
      setRestoreInProgress(false);
    }
  });
  
  // Handle database backup download
  const handleDownloadBackup = async () => {
    try {
      setBackupInProgress(true);
      setBackupError(null);
      
      // Use axios directly with responseType: 'blob' for file download
      const response = await api.get('/settings/backup', {
        responseType: 'blob'
      });
      
      // Create a download link
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      // Use .json extension to match actual content type
      const filename = `backup-${timestamp}.json`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (error) {
      console.error('Download backup error:', error);
      setBackupError('Failed to download backup file');
    } finally {
      setBackupInProgress(false);
    }
  };
  
  // Handle file selection for restore
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file);
        setRestoreError(null);
      } else {
        setRestoreError('Please select a JSON backup file');
        setSelectedFile(null);
      }
    }
  };
  
  // Trigger file input click
  const handleSelectFile = () => {
    fileInputRef.current.click();
  };
  
  // Open restore confirmation dialog
  const handleRestoreClick = () => {
    if (!selectedFile) {
      setRestoreError('Please select a backup file first');
      return;
    }
    setRestoreConfirmOpen(true);
    setConfirmText('');
  };
  
  // Submit restore
  const handleConfirmRestore = () => {
    if (confirmText !== 'RESTORE') {
      return;
    }
    
    setRestoreConfirmOpen(false);
    setRestoreInProgress(true);
    setRestoreError(null);
    
    const formData = new FormData();
    formData.append('backupFile', selectedFile);
    
    restoreMutation.mutate(formData);
  };
  
  // Retention period change handlers
  const handleChange = (event) => {
    setRetentionPeriod(event.target.value);
  };
  
  const handleApply = () => {
    setConfirmDialog(true);
  };
  
  const confirmApply = () => {
    updateRetentionMutation.mutate(retentionPeriod);
    setConfirmDialog(false);
  };
  
  const cancelApply = () => {
    setConfirmDialog(false);
  };
  
  // Format days to human-readable form
  const formatRetentionPeriod = (days) => {
    switch (days) {
      case '1':
        return '1 jour';
      case '7':
        return '7 jours';
      case '30':
        return '30 jours';
      case '90':
        return '90 jours';
      case '365':
        return '1 an';
      default:
        return `${days} jours`;
    }
  };
  
  if (!isAdmin) {
    return (
      <Alert severity="warning">
        Accès restreint aux administrateurs seulement.
      </Alert>
    );
  }
  
  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
        Configuration de Sauvegarde et Rétention
      </Typography>
      
      {/* Success/Error Alerts */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Paramètres de rétention mis à jour avec succès
        </Alert>
      )}
      
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}
      
      {backupSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Sauvegarde téléchargée avec succès
        </Alert>
      )}
      
      {backupError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {backupError}
        </Alert>
      )}
      
      {restoreSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Base de données restaurée avec succès
          {restoreDetails && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {restoreDetails.collectionsRestored} collections restaurées
            </Typography>
          )}
        </Alert>
      )}
      
      {restoreError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {restoreError}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Retention Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2, marginBottom: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configuration de la durée de rétention des données
            </Typography>
            
            {settingsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Typography variant="body2" paragraph color="text.secondary">
                  Définissez la durée pendant laquelle les données d'alarmes et notifications seront conservées dans le système.
                  Passé ce délai, les enregistrements plus anciens seront automatiquement supprimés.
                </Typography>
                
                <Box sx={{ minWidth: 200 }}>
                  <FormControl fullWidth>
                    <InputLabel id="retention-period-label">Durée de rétention</InputLabel>
                    <Select
                      labelId="retention-period-label"
                      id="retention-period"
                      value={retentionPeriod}
                      label="Durée de rétention"
                      onChange={handleChange}
                    >
                      <MenuItem value="1">1 jour</MenuItem>
                      <MenuItem value="7">7 jours</MenuItem>
                      <MenuItem value="30">30 jours</MenuItem>
                      <MenuItem value="90">90 jours</MenuItem>
                      <MenuItem value="365">1 an</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ marginTop: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={handleApply}
                      disabled={updateRetentionMutation.isLoading}
                      sx={{ 
                        backgroundColor: '#2C4C7C', 
                        color: 'white', 
                        '&:hover': { backgroundColor: '#243e65' } 
                      }}
                    >
                      {updateRetentionMutation.isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Appliquer'
                      )}
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
          
          {/* Database Restore */}
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Restauration de la Base de Données
            </Typography>
            
            <Typography variant="body2" paragraph color="text.secondary">
              Restaurez la base de données à partir d'un fichier de sauvegarde JSON. 
              Cette opération remplacera toutes les données existantes.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={handleSelectFile}
                sx={{ mr: 2 }}
              >
                Sélectionner un fichier
              </Button>
              
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                  Fichier sélectionné: {selectedFile.name}
                </Typography>
              )}
              
              <Button
                variant="contained"
                startIcon={<BackupIcon />}
                onClick={handleRestoreClick}
                disabled={!selectedFile || restoreInProgress}
                color="warning"
                sx={{ mt: selectedFile ? 2 : 0 }}
              >
                {restoreInProgress ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Restaurer la Base de Données'
                )}
              </Button>
              
              {restoreInProgress && (
                <Box sx={{ mt: 2, width: '100%' }}>
                  <LinearProgress variant="determinate" value={restoreProgress} />
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    {restoreProgress}% Restauration en cours...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Current Settings & Backup */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Paramètres Actuels
            </Typography>
            
            {settingsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  <strong>Période de rétention des données:</strong> {formatRetentionPeriod(settings?.retentionPeriod || retentionPeriod)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Dernière modification: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString('fr-FR') : 'Jamais'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Par: {settings?.updatedBy || 'N/A'}
                </Typography>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  Sauvegarde de la Base de Données
                </Typography>
                
                <Typography variant="body2" paragraph color="text.secondary">
                  Téléchargez une sauvegarde complète de la base de données. Cette sauvegarde peut être restaurée en cas de besoin.
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadBackup}
                    disabled={backupInProgress}
                    sx={{ 
                      backgroundColor: '#2C4C7C', 
                      color: 'white', 
                      '&:hover': { backgroundColor: '#243e65' },
                      mr: 2
                    }}
                  >
                    {backupInProgress ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Télécharger la sauvegarde'
                    )}
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Retention Settings Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={cancelApply}
        aria-labelledby="retention-dialog-title"
        aria-describedby="retention-dialog-description"
      >
        <DialogTitle id="retention-dialog-title">
          Confirmer le changement de période de rétention
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="retention-dialog-description">
            Êtes-vous sûr de vouloir définir la période de rétention à {formatRetentionPeriod(retentionPeriod)} ?
            <br /><br />
            <strong>Attention:</strong> Les données plus anciennes que la nouvelle période de rétention seront progressivement supprimées lors du prochain cycle de nettoyage.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelApply} color="inherit">
            Annuler
          </Button>
          <Button onClick={confirmApply} variant="contained" color="primary" autoFocus>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        aria-labelledby="restore-dialog-title"
        aria-describedby="restore-dialog-description"
        maxWidth="md"
      >
        <DialogTitle id="restore-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          Confirmer la Restauration de la Base de Données
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="restore-dialog-description" paragraph>
            <strong>ATTENTION: Cette action est irréversible.</strong> La restauration de la base de données remplacera toutes les données existantes par celles du fichier de sauvegarde.
          </DialogContentText>
          
          <DialogContentText paragraph color="error">
            Toutes les données ajoutées depuis la création de cette sauvegarde seront perdues. Assurez-vous de bien comprendre les conséquences avant de continuer.
          </DialogContentText>
          
          <DialogContentText paragraph>
            Pour confirmer, veuillez saisir "RESTORE" dans le champ ci-dessous:
          </DialogContentText>
          
          <TextField
            autoFocus
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESTORE"
            variant="outlined"
            margin="dense"
            error={confirmText !== '' && confirmText !== 'RESTORE'}
            helperText={confirmText !== '' && confirmText !== 'RESTORE' ? 'Veuillez saisir exactement "RESTORE"' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreConfirmOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmRestore} 
            variant="contained" 
            color="error" 
            disabled={confirmText !== 'RESTORE'}
          >
            Restaurer la Base de Données
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BackupandRestore;