// src/App.tsx or App.jsx (depending on your file extension)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Route Protection Components
import { ProtectedRoute } from './routes/ProtectedRoute';
import { SiteRoute } from './routes/SiteRoute';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Monitoring from './pages/Monitoring';
import SiteDetail from './pages/SiteDetail';
import Statistics from './pages/Statistics';
import Configuration from './pages/Configuration';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Historique from './pages/Historique';
import Cartes from './pages/Cartes';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
        },
      },
    },
  },
});

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes - require authentication */}
                <Route element={<ProtectedRoute />}>
                  {/* Main layout wrapper for authenticated pages */}
                  <Route element={<MainLayout />}>
                    {/* Dashboard */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    
                    {/* Always accessible to authenticated users */}
                    <Route path="/monitoring" element={<Monitoring />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* Routes requiring specific permissions */}
                    <Route path="/statistics" element={
                      <ProtectedRoute requiredPermission="VIEW_STATISTICS">
                        <Statistics />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/configuration" element={
                      <ProtectedRoute requiredPermission="VIEW_CONFIGURATION">
                        <Configuration />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/cartes" element={
                      <ProtectedRoute requiredPermission="VIEW_CARTES">
                        <Cartes />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/historique" element={
                      <ProtectedRoute requiredPermission="VIEW_HISTORIQUE">
                        <Historique />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/users" element={
                      <ProtectedRoute requiredPermission="MANAGE_USERS">
                        <UserManagement />
                      </ProtectedRoute>
                    } />
                    
                    {/* Site-specific routes with additional access control */}
                    <Route element={<SiteRoute />}>
                      <Route path="/sites/:siteId" element={<SiteDetail />} />
                    </Route>
                    
                    {/* Error and utility pages */}
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;