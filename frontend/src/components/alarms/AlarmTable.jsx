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
  IconButton,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
  TablePagination
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAcknowledgeAlarm } from '../../hooks/useAlarms';
import { useAuth } from '../../context/AuthContext';

const AlarmTable = ({ alarms, isLoading, error }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { user } = useAuth();
  const acknowledgeAlarm = useAcknowledgeAlarm();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAcknowledge = (alarmId) => {
    if (!user || !alarmId) return;
    
    acknowledgeAlarm.mutate({ 
      alarmId, 
      userId: user.id 
    });
  };

  // Status chip color mapping
  const getStatusChip = (status) => {
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          Erreur de chargement des alarmes: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!alarms || alarms.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Aucune alarme trouvée
        </Typography>
      </Box>
    );
  }

  // Apply pagination
  const displayedAlarms = alarms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Site</TableCell>
              <TableCell>Équipement</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Horodatage</TableCell>
              <TableCell>Reconnu par</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedAlarms.map((alarm) => (
              <TableRow 
                key={alarm.id}
                sx={{ 
                  '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                  backgroundColor: alarm.status === 'CRITICAL' 
                    ? 'rgba(244, 67, 54, 0.05)' 
                    : alarm.status === 'MAJOR' 
                      ? 'rgba(255, 152, 0, 0.05)' 
                      : 'inherit'
                }}
              >
                <TableCell>{alarm.siteId}</TableCell>
                <TableCell>{alarm.equipment}</TableCell>
                <TableCell>{alarm.description}</TableCell>
                <TableCell>{getStatusChip(alarm.status)}</TableCell>
                <TableCell>{new Date(alarm.timestamp).toLocaleString('fr-FR')}</TableCell>
                <TableCell>
                  {alarm.acknowledgedBy ? alarm.acknowledgedBy : '-'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Reconnaître l'alarme">
                    <span>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleAcknowledge(alarm.id)}
                        disabled={!!alarm.acknowledgedBy || acknowledgeAlarm.isLoading}
                      >
                        <DoneIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Détails">
                    <IconButton size="small" color="info">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={alarms.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />
    </>
  );
};

export default AlarmTable;