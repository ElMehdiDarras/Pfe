// src/App.js
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
import Login from './components/Login';
import Logout from './components/Logout';
import UserProfile from './components/UserProfile';
import Unauthorized from './components/Unauthorized';

// Import Route guards
import { PrivateRoute, RoleRoute, SiteRoute } from './components/PrivateRoutes';
import { AuthProvider } from './context/AuthContext';
// Import Providers
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
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Protected routes - require authentication */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Dashboard />} />
        <Route path="/monitoring" element={<MonitoringView />} />
        <Route path="/profile" element={<UserProfile />} />
        
        {/* Site routes - require site access */}
        <Route element={<SiteRoute />}>
          <Route path="/sites/:siteId" element={<SiteDetail />} />
          <Route path="/local/:siteId" element={<LocalDashboard />} />
        </Route>
        
        {/* Admin/Supervisor only routes */}
        <Route element={<RoleRoute allowedRoles={['administrator', 'supervisor']} />}>
          <Route path="/statistique" element={<StatisticsView />} />
          <Route path="/cartes" element={<MapsView />} />
          <Route path="/historique" element={<HistoryView />} />
        </Route>
        
        {/* Admin only routes */}
        <Route element={<RoleRoute allowedRoles={['administrator']} />}>
          <Route path="/configuration" element={<ConfigurationView />} />
        </Route>
      </Route>
      
      {/* Catch all - redirect to dashboard or login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Component to conditionally render navigation
const AppRoutes = () => {
  const location = window.location;
  const isLoginPage = location.pathname === '/login';
  
  return (
    <>
      {!isLoginPage && <Navigation />}
      <AppContent />
    </>
  );
};

export default App;