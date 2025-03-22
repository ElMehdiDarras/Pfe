// src/components/alarms/AlarmTable.jsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  CircularProgress
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import alarmService from '../../api/services/alarmService';
import { useAuth } from '../../context/AuthContext';

// Status chip colors
const getStatusColor = (status) => {
  switch (status) {
    case 'CRITICAL':
      return 'error';
    case 'MAJOR':
      return 'warning';
    case 'WARNING':
      return 'warning';
    case 'OK':
      return 'success';
    default:
      return 'default';
  }
};

// Format the timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting timestamp:', e);
    return 'Invalid date';
  }
};

const AlarmTable = ({ alarms = [], showAcknowledgeButton = false, onRefreshNeeded }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alarmId: null });
  
  // Mutation for acknowledging alarms
  const acknowledgeMutation = useMutation({
    mutationFn: (alarmId) => {
      return alarmService.acknowledgeAlarm(alarmId, user.id);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      
      // If a callback for refresh is provided, call it
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    }
  });
  
  // Handle alarm acknowledgment
  const handleAcknowledge = (alarmId) => {
    if (!alarmId) {
      console.error('Cannot acknowledge alarm: Missing alarm ID');
      return;
    }
    
    setConfirmDialog({ open: true, alarmId });
  };
  
  // Confirm acknowledgment
  const confirmAcknowledge = () => {
    if (confirmDialog.alarmId) {
      acknowledgeMutation.mutate(confirmDialog.alarmId);
    }
    setConfirmDialog({ open: false, alarmId: null });
  };
  
  // Cancel acknowledgment
  const cancelAcknowledge = () => {
    setConfirmDialog({ open: false, alarmId: null });
  };
  
  // Sort alarms by timestamp (newest first)
  const sortedAlarms = [...alarms].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="alarm table">
          <TableHead>
            <TableRow>
              <TableCell>Site</TableCell>
              <TableCell>Équipement</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Horodatage</TableCell>
              {showAcknowledgeButton && (
                <TableCell>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAlarms.length > 0 ? (
              sortedAlarms.map((alarm) => (
                <TableRow 
                  key={alarm._id || `alarm-${alarm.siteId}-${alarm.equipment}-${alarm.timestamp}`}
                  sx={{ 
                    backgroundColor: 
                      alarm.status === 'CRITICAL' ? 'rgba(211, 47, 47, 0.08)' : 
                      alarm.status === 'MAJOR' ? 'rgba(237, 108, 2, 0.08)' : 
                      alarm.status === 'WARNING' ? 'rgba(255, 193, 7, 0.08)' : 
                      'inherit'
                  }}
                >
                  <TableCell>{alarm.siteId}</TableCell>
                  <TableCell>{alarm.equipment}</TableCell>
                  <TableCell>{alarm.description}</TableCell>
                  <TableCell>
                    <Chip 
                      label={alarm.status} 
                      color={getStatusColor(alarm.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatTimestamp(alarm.timestamp)}</TableCell>
                  {showAcknowledgeButton && (
                    <TableCell>
                      {alarm.status !== 'OK' && !alarm.acknowledgedBy && (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          onClick={() => handleAcknowledge(alarm._id)}
                          disabled={acknowledgeMutation.isLoading && acknowledgeMutation.variables === alarm._id}
                        >
                          {acknowledgeMutation.isLoading && acknowledgeMutation.variables === alarm._id ? (
                            <CircularProgress size={20} />
                          ) : (
                            'Acquitter'
                          )}
                        </Button>
                      )}
                      {alarm.acknowledgedBy && (
                        <Typography variant="body2" color="text.secondary">
                          Acquitté par {alarm.acknowledgedBy}
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showAcknowledgeButton ? 6 : 5} align="center">
                  Aucune alarme trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={cancelAcknowledge}
        aria-labelledby="acknowledge-dialog-title"
      >
        <DialogTitle id="acknowledge-dialog-title">
          Confirmer l'acquittement
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment acquitter cette alarme ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelAcknowledge} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={confirmAcknowledge} 
            color="primary" 
            variant="contained"
            disabled={acknowledgeMutation.isLoading}
          >
            {acknowledgeMutation.isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Confirmer'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AlarmTable;