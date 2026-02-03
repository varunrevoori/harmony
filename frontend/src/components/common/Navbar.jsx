import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogoutOutlined } from '@mui/icons-material';

const Navbar = ({ title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return '#ef4444';
      case 'SERVICE_PROVIDER':
        return '#8b5cf6';
      case 'END_USER':
        return '#2dd4bf';
      default:
        return '#64748b';
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          {title || 'Harmony'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right', mr: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
              {user?.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                bgcolor: getRoleColor(user?.role),
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {user?.role?.replace('_', ' ')}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: 'white',
              color: '#2dd4bf',
              fontWeight: 700,
              width: 40,
              height: 40,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutOutlined />}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              borderRadius: 2,
              px: 2,
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
