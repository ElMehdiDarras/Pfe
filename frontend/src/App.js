import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box, Alert } from '@mui/material';

// Import components
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import MonitoringView from './components/MonitoringView';
import ConfigurationView from './components/ConfigurationView';
import StatisticsView from './components/StatisticsView';
import MapsView from './components/MapsView';
import HistoryView from './components/HistoryView';
import SiteDetail from './components/SiteDetail';
import LocalDashboard from './components/LocalDashboard';

// Import DataProvider
import { DataProvider, useData } from './context/DataProvider';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Loading component
const LoadingScreen = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress size={60} />
  </Box>
);

// Error display component
const ErrorScreen = ({ message }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <Alert severity="error" sx={{ maxWidth: 600 }}>
      {message || 'An error occurred while loading data. Please try again later.'}
    </Alert>
  </Box>
);

// Main App content with routes
const AppContent = () => {
  const { loading, error } = useData();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (error) {
    return <ErrorScreen message={error} />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/overview" element={<Dashboard />} />
      <Route path="/monitoring" element={<MonitoringView />} />
      <Route path="/configuration" element={<ConfigurationView />} />
      <Route path="/statistique" element={<StatisticsView />} />
      <Route path="/cartes" element={<MapsView />} />
      <Route path="/historique" element={<HistoryView />} />
      <Route path="/sites/:siteId" element={<SiteDetail />} />
      <Route path="/local/:siteId" element={<LocalDashboard />} />
    </Routes>
  );
};

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DataProvider>
        <Router>
          <Navigation />
          <AppContent />
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;