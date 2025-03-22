// src/components/layout/Footer.jsx
import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  // This will automatically update the year
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 2, 
        px: 2, 
        mt: 'auto', 
        backgroundColor: '#2c4c7c', // ThingsBoard blue to match navbar
        color: 'white',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        width: '100%'
      }}
    >
      <Typography variant="body2" align="center">
        © {currentYear} AlarmSense. All rights reserved.
      </Typography>
      <Typography variant="body2" align="center" sx={{ mt: 0.5 }}>
        <Link 
          href="https://www.netsense.ma" 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{ color: '#FF5722', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Visit Our Website
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;