// src/App.js with ThingsBoard theme and proper layout
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import theme
import thingsboardTheme from './theme/thingboardtheme';
import 'leaflet/dist/leaflet.css';
import './styles/thingsboard-theme.css';
import './styles/dashboard-cards.css';
import './styles/setup-leaflet-css.css';
import './styles/global.css';
// Contexts
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
// Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
// Pages
import Dashboard from './pages/Dashboard';
import BackupandRestore from './pages/BackupandRestore';
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

function App() {
  return (
    <ThemeProvider theme={thingsboardTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
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
                    <Route path="Unauthorized" element={<Unauthorized />} />
                    <Route path='BackupandRestore' element={<BackupandRestore/>}></Route>
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