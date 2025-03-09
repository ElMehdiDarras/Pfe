// src/pages/Statistics.jsx
import React from 'react';
import {
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAlarmStatistics } from '../hooks/useAlarms';
import { useSites } from '../hooks/useSites';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

const Statistics = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useAlarmStatistics();
  const { data: sites, isLoading: sitesLoading } = useSites();

  const isLoading = statsLoading || sitesLoading;

  // Define colors for charts
  const COLORS = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50'];
  const NAMES = {
    critical: 'Critical',
    major: 'Major',
    warning: 'Warning',
    ok: 'OK'
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statsError) {
    return <Alert severity="error">Échec de chargement des données statistiques</Alert>;
  }

  // Prepare data for pie chart
  const pieData = [
    { name: 'Critical', value: stats?.summary.critical || 0, color: COLORS[0] },
    { name: 'Major', value: stats?.summary.major || 0, color: COLORS[1] },
    { name: 'Warning', value: stats?.summary.warning || 0, color: COLORS[2] },
    { name: 'OK', value: stats?.summary.ok || 0, color: COLORS[3] },
  ].filter(item => item.value > 0); // Only include non-zero values

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Prepare data for line chart (monthly trend)
  const lineData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    critique: Math.floor(Math.random() * 3) + 1,  // Mock data
    majeure: Math.floor(Math.random() * 5) + 1,   // Mock data
    warning: Math.floor(Math.random() * 7) + 2    // Mock data
  }));

  // Prepare data for bar chart (site statistics)
  const barData = sites?.map(site => ({
    name: site.name,
    critical: Math.floor(Math.random() * 2),    // Mock data
    major: Math.floor(Math.random() * 2),       // Mock data
    warning: Math.floor(Math.random() * 2),     // Mock data
    ok: Math.floor(Math.random() * 7) + 3       // Mock data
  })) || [];

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
        Statistiques des Alarmes
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Pie Chart - Alarm Distribution by Type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
              Distribution des Alarmes par Type
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    formatter={(value, entry) => {
                      const { color } = entry.payload;
                      return <span style={{ color }}>{value}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Line Chart - Alarm Trend (Past Month) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
              Tendance des Alarmes (Dernier Mois)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickLine={{ stroke: '#e0e0e0' }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    interval={5}
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
                    iconType="circle"
                    formatter={(value) => {
                      let color;
                      switch(value) {
                        case 'critique':
                          color = '#f44336';
                          break;
                        case 'majeure':
                          color = '#ff9800';
                          break;
                        case 'warning':
                          color = '#ffeb3b';
                          break;
                      }
                      return <span style={{ color }}>{value}</span>;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="critique" 
                    stroke="#f44336" 
                    strokeWidth={2} 
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="majeure" 
                    stroke="#ff9800" 
                    strokeWidth={2} 
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="warning" 
                    stroke="#ffeb3b" 
                    strokeWidth={2} 
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bar Chart - Statistics by Site */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium', fontSize: '1.2rem' }}>
        Statistiques par Site
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
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
                verticalAlign="top" 
                height={36}
                formatter={(value) => {
                  let color;
                  switch(value) {
                    case 'critical':
                      value = 'Critique';
                      color = '#f44336';
                      break;
                    case 'major':
                      value = 'Majeure';
                      color = '#ff9800';
                      break;
                    case 'warning':
                      value = 'Warning';
                      color = '#ffeb3b';
                      break;
                    case 'ok':
                      value = 'OK';
                      color = '#4caf50';
                      break;
                  }
                  return <span style={{ color }}>{value}</span>;
                }}
              />
              <Bar dataKey="critical" stackId="a" fill="#f44336" />
              <Bar dataKey="major" stackId="a" fill="#ff9800" />
              <Bar dataKey="warning" stackId="a" fill="#ffeb3b" />
              <Bar dataKey="ok" stackId="a" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </>
  );
};

export default Statistics;