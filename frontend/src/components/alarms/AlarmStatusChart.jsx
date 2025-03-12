// In your AlarmStatusChart.jsx, add more robust error handling:
import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Typography, Box } from '@mui/material';

const AlarmStatusChart = ({ data, height = 300 }) => {
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Validate the data format
    if (data && Array.isArray(data)) {
      console.log('Chart data:', data);
      
      // Check if data has the right structure
      const hasValidStructure = data.every(item => 
        typeof item === 'object' && 
        'hour' in item && 
        ('critical' in item || 'major' in item || 'warning' in item)
      );
      
      if (!hasValidStructure) {
        setError('Les données n\'ont pas le format attendu pour le graphique');
        console.error('Invalid chart data structure:', data);
      } else {
        setError(null);
      }
    }
  }, [data]);
  
  // Show error message if data is invalid
  if (error) {
    return (
      <Box 
        sx={{
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px dashed #ccc',
          borderRadius: '4px',
          color: 'error.main',
          flexDirection: 'column',
          p: 2
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Vérifiez la console pour plus de détails.
        </Typography>
      </Box>
    );
  }
  
  // Safety check for data
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px dashed #ccc',
          borderRadius: '4px',
          color: 'text.secondary'
        }}
      >
        <Typography>
          Aucune donnée disponible pour le graphique
        </Typography>
      </Box>
    );
  }
  
  try {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={{ stroke: '#e0e0e0' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={{ stroke: '#e0e0e0' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '4px'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
          />
          <Line
            type="monotone"
            dataKey="critical"
            stroke="#f44336"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            name="Critique"
          />
          <Line
            type="monotone"
            dataKey="major"
            stroke="#ff9800"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            name="Majeure"
          />
          <Line
            type="monotone"
            dataKey="warning"
            stroke="#ffeb3b"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            name="Warning"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  } catch (renderError) {
    console.error('Error rendering chart:', renderError);
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px dashed #ccc',
          borderRadius: '4px',
          color: 'error.main'
        }}
      >
        <Typography>
          Erreur lors du rendu du graphique
        </Typography>
      </Box>
    );
  }
};

export default AlarmStatusChart;