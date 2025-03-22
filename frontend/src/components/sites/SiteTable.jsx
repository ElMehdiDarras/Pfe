// In src/components/sites/SiteTable.jsx
import React from 'react';
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
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const SiteTable = ({ sites, isLoading, error }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 1 }}>
        <Typography color="error">
          Erreur de chargement des sites. Veuillez rafraîchir la page.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <Table size="medium">
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell>Nom du Site</TableCell>
            <TableCell>Emplacement</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Nombre de Boxes</TableCell>
            <TableCell>Nombre d'Équipements</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sites && sites.map((site) => (
            <TableRow 
              key={site.id || site._id}
              sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}
            >
              <TableCell>{site.name}</TableCell>
              <TableCell>{site.location}</TableCell>
              <TableCell>
                {site.status === 'CRITICAL' ? (
                  <Chip label="CRITICAL" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />
                ) : site.status === 'MAJOR' ? (
                  <Chip label="MAJOR" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
                ) : site.status === 'WARNING' ? (
                  <Chip label="WARNING" size="small" sx={{ backgroundColor: '#ffeb3b', color: 'black' }} />
                ) : (
                  <Chip label="OK" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
                )}
              </TableCell>
              <TableCell>{site.boxCount || 0}</TableCell>
              <TableCell>{site.equipmentCount || 0}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  to={`/SiteDetail/${site.id}`}
                  startIcon={<InfoIcon />}
                  color="primary"
                  size="small"
                  variant="text"
                >
                  Détails
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!sites || sites.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Aucun site trouvé
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SiteTable;