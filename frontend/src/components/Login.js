import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        username,
        password
      });

      // Save token and user info
      const { token, user } = response.data;
      login(token, user);

      // Redirect based on user role
    // In your Login.js file, update the redirection logic
if (user.role === 'administrator' || user.role === 'supervisor') {
  navigate('/dashboard');
} else {
  // For agents, redirect to dashboard by default
  // This avoids the unauthorized issue for now
  navigate('/dashboard');
  
  // For debugging, log what would have been the redirect URL
  if (user.sites && user.sites.length > 0) {
    const firstSiteName = user.sites[0];
    const formattedSiteId = firstSiteName.replace(/\s+/g, '-');
    console.log(`Agent would be redirected to: /sites/${formattedSiteId}`);
    console.log(`Original site name: ${firstSiteName}`);
  }
}
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            AlarmManager Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            
            <FormControl sx={{ mt: 2 }} variant="outlined" fullWidth required>
              <InputLabel htmlFor="password">Password</InputLabel>
              <OutlinedInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;