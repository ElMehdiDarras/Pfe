import React from 'react';
import { 
  Container, Typography, Grid,
  Card, CardContent, CardHeader, CircularProgress
} from '@mui/material';
import { 
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import { useData } from '../context/DataProvider';

function StatisticsView() {
  const { sites, alarms, statistics, last24HoursData, loading } = useData();
  
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Generate statistics per site
  const siteStats = sites.map(site => {
    const siteAlarms = alarms.filter(alarm => alarm.siteId === site.name);
    return {
      name: site.name,
      total: siteAlarms.length,
      critical: siteAlarms.filter(a => a.status === 'CRITICAL').length,
      major: siteAlarms.filter(a => a.status === 'MAJOR').length,
      warning: siteAlarms.filter(a => a.status === 'WARNING').length,
      ok: siteAlarms.filter(a => a.status === 'OK').length,
    };
  });
  
  // Data for pie chart
  const pieData = [
    { name: 'Critical', value: statistics.critical, color: '#f44336' },
    { name: 'Major', value: statistics.major, color: '#ff9800' },
    { name: 'Warning', value: statistics.warning, color: '#ffeb3b' },
    { name: 'OK', value: statistics.ok, color: '#4caf50' },
  ];
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="div">
        Statistiques des Alarmes
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Distribution des Alarmes par Type" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Nombre d\'alarmes']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Tendance des Alarmes (Dernier Mois)" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last24HoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="critical" name="Critique" stroke="#f44336" dot={false} />
                  <Line type="monotone" dataKey="major" name="Majeure" stroke="#ff9800" dot={false} />
                  <Line type="monotone" dataKey="warning" name="Warning" stroke="#ffeb3b" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Statistiques par Site" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={siteStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="critical" name="Critique" stackId="a" fill="#f44336" />
                  <Bar dataKey="major" name="Majeure" stackId="a" fill="#ff9800" />
                  <Bar dataKey="warning" name="Warning" stackId="a" fill="#ffeb3b" />
                  <Bar dataKey="ok" name="OK" stackId="a" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default StatisticsView;