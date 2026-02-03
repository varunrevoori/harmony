import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  MenuItem,
  Alert,
  Grid
} from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'END_USER',
    businessName: '',
    serviceType: '',
    description: '',
    basePrice: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register(formData);
      
      if (response.success) {
        toast.success('Registration successful!');
        
        // Redirect based on role
        const user = response.data?.user || response.user;
        if (user.role === 'SERVICE_PROVIDER' && !user.isApproved) {
          toast.info('Your provider account is pending approval');
          navigate('/login');
        } else if (user.role === 'SERVICE_PROVIDER') {
          navigate('/provider');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join Harmony to start booking or providing services
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  select
                  name="role"
                  label="Register As"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <MenuItem value="END_USER">End User</MenuItem>
                  <MenuItem value="SERVICE_PROVIDER">Service Provider</MenuItem>
                </TextField>
              </Grid>

              {formData.role === 'SERVICE_PROVIDER' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      name="businessName"
                      label="Business Name"
                      value={formData.businessName}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      select
                      name="serviceType"
                      label="Service Type"
                      value={formData.serviceType}
                      onChange={handleChange}
                    >
                      <MenuItem value="HEALTHCARE">Healthcare</MenuItem>
                      <MenuItem value="CONSULTING">Consulting</MenuItem>
                      <MenuItem value="BEAUTY">Beauty</MenuItem>
                      <MenuItem value="FITNESS">Fitness</MenuItem>
                      <MenuItem value="EDUCATION">Education</MenuItem>
                      <MenuItem value="LEGAL">Legal</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="description"
                      label="Business Description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      name="basePrice"
                      label="Base Price (USD)"
                      value={formData.basePrice}
                      onChange={handleChange}
                    />
                  </Grid>
                </>
              )}
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 3,
                mb: 2,
                background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
                fontSize: '1rem',
              }}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: '#0f766e' }}>
                  Already have an account? <strong>Sign In</strong>
                </Typography>
              </Link>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                  ← Back to Home
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
