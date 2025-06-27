import React, { useState, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const SessionExpiredNotification = () => {
  const { error, clearError } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (error && (error.includes('session has expired') || error.includes('Authentication'))) {
      setOpen(true);
    }
  }, [error]);

  const handleClose = () => {
    setOpen(false);
    clearError();
  };

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={6000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="warning" onClose={handleClose}>
        {error || 'Your session has expired. Please log in again.'}
      </Alert>
    </Snackbar>
  );
};

export default SessionExpiredNotification;