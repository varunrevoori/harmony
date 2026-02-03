import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  AppBar,
  Toolbar,
  Stack,
} from '@mui/material';
import {
  CalendarMonth,
  TrendingUp,
  VerifiedUser,
  Schedule,
  Analytics,
  Stars,
  CheckCircle,
  Speed,
  Security,
} from '@mui/icons-material';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <CalendarMonth sx={{ fontSize: 48, color: '#2dd4bf' }} />,
      title: 'Smart Booking',
      description: 'Effortlessly book appointments with real-time availability checking',
    },
    {
      icon: <Schedule sx={{ fontSize: 48, color: '#2dd4bf' }} />,
      title: 'Dynamic Scheduling',
      description: 'Providers set flexible schedules with automatic slot generation',
    },
    {
      icon: <Analytics sx={{ fontSize: 48, color: '#2dd4bf' }} />,
      title: 'Analytics Dashboard',
      description: 'Track utilization rates, bookings, and performance metrics',
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 48, color: '#2dd4bf' }} />,
      title: 'Provider Verification',
      description: 'Admin-approved service providers ensure quality and trust',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: '#2dd4bf' }} />,
      title: 'Business Growth',
      description: 'Comprehensive audit logs and insights for data-driven decisions',
    },
    {
      icon: <Stars sx={{ fontSize: 48, color: '#2dd4bf' }} />,
      title: 'Rating System',
      description: 'User reviews and ratings help maintain service excellence',
    },
  ];

  const benefits = [
    { icon: <CheckCircle />, text: 'Multi-role access control (Admin, Provider, User)' },
    { icon: <CheckCircle />, text: 'Automated appointment state management' },
    { icon: <CheckCircle />, text: 'No double-booking with smart overlap prevention' },
    { icon: <Speed />, text: 'Lightning-fast real-time availability computation' },
    { icon: <Security />, text: 'Secure JWT authentication and role-based access' },
    { icon: <CheckCircle />, text: 'Comprehensive audit logging for compliance' },
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Navigation */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Harmony
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button color="inherit" sx={{ color: '#64748b' }} onClick={() => navigate('/')}>
                Home
              </Button>
              <Button color="inherit" sx={{ color: '#64748b' }} onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
                  color: 'white',
                }}
                onClick={() => navigate('/register')}
              >
                Start For Free
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
          pt: 10,
          pb: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 3,
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f766e 100%)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Everything You Need For Seamless Booking
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                Boost engagement and efficiency using Harmony's smart booking engine, dynamic availability
                management, and built-in analytics tools.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ py: 1.5, px: 4, fontSize: '1.1rem', borderColor: '#2dd4bf', color: '#0f766e' }}
                >
                  Sign In
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  p: 4,
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
                  borderRadius: 4,
                  boxShadow: '0 20px 60px rgba(45, 212, 191, 0.3)',
                }}
              >
                <Typography variant="h3" sx={{ color: 'white', textAlign: 'center', mb: 2 }}>
                  🎯
                </Typography>
                <Typography variant="h5" sx={{ color: 'white', textAlign: 'center', fontWeight: 600 }}>
                  Multi-Role Booking Engine
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', mt: 2 }}>
                  Built for Admins, Service Providers, and End Users
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h2" textAlign="center" sx={{ mb: 2 }}>
          Powerful Features
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
          Everything you need to manage bookings efficiently
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'center',
                  p: 3,
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: '#ffffff', py: 10 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" textAlign="center" sx={{ mb: 6 }}>
            Why Choose Harmony?
          </Typography>
          <Grid container spacing={3}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: '#2dd4bf' }}>{benefit.icon}</Box>
                  <Typography variant="body1">{benefit.text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ color: 'white', mb: 3 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}>
            Join thousands of businesses streamlining their booking process
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              py: 2,
              px: 5,
              fontSize: '1.2rem',
              bgcolor: 'white',
              color: '#0f766e',
              '&:hover': {
                bgcolor: '#f0fdfa',
              },
            }}
          >
            Start For Free
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1e293b', py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          © 2026 Harmony Booking Engine. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;
