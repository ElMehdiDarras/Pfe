// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      // Auth context will update and useEffect will redirect
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    
<Box sx={{ 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
  flexDirection: 'column',
}}>
  <Paper 
    elevation={3} 
    sx={{ 
      width: '100%', 
      maxWidth: '450px',
      backgroundColor: '#2c4c7c',
      color: 'white',
      borderRadius: 1,
      p: 4,
    }}
  >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Typography 
  component="h1" 
  variant="h4" 
  align="center" 
  gutterBottom
  sx={{ 
    color: 'white',
    fontWeight: 'medium',
    display: 'flex',
    alignItems: 'center',
    gap: 1
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <img 
      src="/icons/Maroc_telecom_logo.svg" 
      alt="Maroc Telecom Logo" 
      style={{ height: '30px', width: 'auto', marginRight: '12px' }}
      onError={(e) => {
        console.error("Logo failed to load");
        e.target.style.display = 'none';
      }}
    />
    <img 
      src="/icons/logo-white.png" 
      alt="AlarmManager Logo" 
      style={{ height: '40px', width: 'auto' }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
    AlarmSense
  </Box>
</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              fullWidth
              id="username"
              placeholder="Username (email)"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              }}
            />
          </Box>

          <Box sx={{ position: 'relative', mb: 1 }}>
            <TextField
              fullWidth
              id="password"
              name="password"
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              }}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              mt: 1, 
              mb: 2, 
              py: 1.5,
              backgroundColor: '#FF5722', // ThingsBoard orange for button
              '&:hover': {
                backgroundColor: '#E64A19',
              },
              boxShadow: 'none',
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </Box>
      </Paper>
      <Box sx={{ width: '100%', maxWidth: '450px', mt: 0 }}>
    <Footer />
  </Box>
    </Box>
  );
};

export default Login;