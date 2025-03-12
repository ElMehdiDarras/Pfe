// src/App.js with QueryClientProvider and updated routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// Add QueryClient imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Contexts
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
// Components
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SiteDetail from './pages/SiteDetail';
import SiteMapView from './pages/SiteMapView';
import Monitoring from './pages/Monitoring';
import Statistics from './pages/Statistics';
import Configuration from './pages/Configuration';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Cartes from './pages/Cartes';
import UserManagement from './pages/UserManagement';
import Historique from './pages/Historique';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* Protected routes using MainLayout */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="Cartes" element={<Cartes />} />
                    <Route path="SiteDetail/:siteId" element={<SiteDetail />} />
                    <Route path="SiteMapView" element={<SiteMapView />} />
                    <Route path="Monitoring" element={<Monitoring />} />
                    <Route path="Statistics" element={<Statistics />} />
                    <Route path="Configuration" element={<Configuration />} />
                    <Route path="UserManagement" element={<UserManagement />} />
                    <Route path="Historique" element={<Historique />} />
                    <Route path="Profile" element={<Profile />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Router>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;