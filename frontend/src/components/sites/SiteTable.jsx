// src/components/sites/SiteTable.jsx
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
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import Auth context

const SiteTable = ({ sites, isLoading, error }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user

// Add this in SiteTable.jsx before navigation
// In SiteTable.jsx, modify handleSiteClick
const handleSiteClick = (site) => {
  // Ensure we have a valid ID to navigate with
  const siteId = site.id || site._id;
  
  // If siteId is undefined, try to use the site name 
  const navId = siteId || site.name;
  
  // Log what we're navigating to
  console.log('Navigating to site:', navId);
  
  navigate(`/sites/${navId}`);
};
  // Function to render status chip
  const renderStatusChip = (status) => {
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

  // Function to check if user has access to a site
  const hasAccessToSite = (siteName) => {
    if (!user) return false;
    
    // Admin and supervisor have access to all sites
    if (user.role === 'administrator' || user.role === 'supervisor') {
      return true;
    }
    
    // Agent only has access to assigned sites
    return user.sites && user.sites.includes(siteName);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ p: 2 }}>
        Erreur de chargement des sites
      </Typography>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <Typography align="center" sx={{ p: 2, color: 'text.secondary' }}>
        Aucun site trouvé
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell>Nom du Site</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>VLAN</TableCell>
            <TableCell>Emplacement</TableCell>
            <TableCell>Alarmes actives</TableCell>
            <TableCell>Nombre d'Équipements</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sites.map((site) => {
            // Determine if user has access to this site
            const hasAccess = hasAccessToSite(site.name);
            
            return (
              <TableRow 
                key={site._id}
                hover={hasAccess} // Only show hover effect if user has access
                onClick={() => hasAccess && handleSiteClick(site)}
                sx={{ 
                  cursor: hasAccess ? 'pointer' : 'default',
                  '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                  backgroundColor: site.status === 'CRITICAL' 
                    ? 'rgba(244, 67, 54, 0.05)' 
                    : site.status === 'MAJOR' 
                      ? 'rgba(255, 152, 0, 0.05)' 
                      : 'inherit',
                  opacity: hasAccess ? 1 : 0.7 // Visual indication of inaccessible sites
                }}
              >
                <TableCell>{site.name}</TableCell>
                <TableCell>{renderStatusChip(site.status)}</TableCell>
                <TableCell>{site.vlan || '-'}</TableCell>
                <TableCell>{site.location}</TableCell>
                <TableCell>{site.activeAlarms}</TableCell>
                <TableCell>{site.equipment?.length || 0}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SiteTable;