import React, { useState } from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, MenuItem, Select, Button } from '@mui/material';

const BackupandRestore = ({ onChange }) => {
  const [retentionPeriod, setRetentionPeriod] = useState('7');

  const handleChange = (event) => {
    const value = event.target.value;
    setRetentionPeriod(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      <Typography variant="h6" gutterBottom>
        Configuration de la durée de rétention des données
      </Typography>
      <Box sx={{ minWidth: 200 }}>
        <FormControl fullWidth>
          <InputLabel>Durée de rétention</InputLabel>
          <br />
          <Select value={retentionPeriod} onChange={handleChange}>
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
            sx={{ backgroundColor: '#2C4C7C', color: 'white', '&:hover': { backgroundColor: '#243e65' } }}
          >
            Appliquer
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default BackupandRestore;
