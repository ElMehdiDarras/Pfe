import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, IconButton, CircularProgress,
  Tooltip, Snackbar, Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Component for displaying alarm data in a table with acknowledgment functionality
 * @param {Object} props - Component props
 * @param {Array} props.alarms - List of alarms to display
 * @param {boolean} props.showAcknowledge - Whether to show acknowledge button
 * @param {Function} props.onAcknowledge - Function to call when acknowledging an alarm
 */
function AlarmTable({ alarms, showAcknowledge = false, onAcknowledge }) {
  const [acknowledging, setAcknowledging] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusChip = (status) => {
    let color = 'default';
    
    switch(status) {
      case 'CRITICAL':
        color = 'error';
        break;
      case 'MAJOR':
        color = 'warning';
        break;
      case 'WARNING':
        color = 'info';
        break;
      case 'OK':
        color = 'success';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  const handleAcknowledge = async (alarmId) => {
    if (!onAcknowledge) return;
    
    setAcknowledging(alarmId);
    try {
      const success = await onAcknowledge(alarmId);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Alarme acquittée avec succès',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: "Échec de l'acquittement de l'alarme",
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error acknowledging alarm:', error);
      setSnackbar({
        open: true,
        message: "Une erreur s'est produite lors de l'acquittement de l'alarme",
        severity: 'error'
      });
    } finally {
      setAcknowledging(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Site</TableCell>
              <TableCell>Équipement</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Horodatage</TableCell>
              {showAcknowledge && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {alarms && alarms.length > 0 ? (
              alarms.map((alarm) => (
                <TableRow key={alarm._id} sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: alarm.status === 'CRITICAL' ? 'rgba(255,0,0,0.05)' : 
                          alarm.status === 'MAJOR' ? 'rgba(255,153,0,0.05)' : 
                          'inherit'
                }}>
                  <TableCell>{alarm.siteId}</TableCell>
                  <TableCell>{alarm.boxId}</TableCell>
                  <TableCell>{alarm.description}</TableCell>
                  <TableCell>{getStatusChip(alarm.status)}</TableCell>
                  <TableCell>{formatDate(alarm.timestamp)}</TableCell>
                  {showAcknowledge && (
                    <TableCell>
                      {alarm.acknowledged ? (
                        <Chip 
                          label="Acquittée" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                          icon={<CheckCircleIcon />} 
                        />
                      ) : (
                        <Tooltip title="Acquitter l'alarme">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleAcknowledge(alarm._id)}
                            disabled={acknowledging === alarm._id}
                          >
                            {acknowledging === alarm._id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <CheckCircleIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showAcknowledge ? 6 : 5} align="center">
                  Aucune alarme à afficher
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default AlarmTable;