// src/components/sites/SiteTable.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const SiteTable = ({ sites, isLoading, error }) => {
  const navigate = useNavigate();

  const handleSiteClick = (site) => {
    // Convert site name to URL-friendly format
    const siteId = site.name.replace(/\s+/g, '-');
    navigate(`/SiteDetail/${siteId}`);
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
          Erreur de chargement des sites: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Aucun site trouvé
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <Table size="small">
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
          {sites.map((site) => (
            <TableRow 
              key={site.id || site._id}
              sx={{ 
                '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
              onClick={() => handleSiteClick(site)}
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
              <TableCell>{site.boxes?.length || 0}</TableCell>
              <TableCell>{site.equipment?.length || 0}</TableCell>
              <TableCell>
                <Tooltip title="Détails du site">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSiteClick(site);
                    }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SiteTable;