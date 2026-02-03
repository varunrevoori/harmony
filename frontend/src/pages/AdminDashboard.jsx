import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import Navbar from '../components/common/Navbar';
import UserManagement from '../components/admin/UserManagement';
import ProviderApproval from '../components/admin/ProviderApproval';
import AuditLogs from '../components/admin/AuditLogs';
import Analytics from '../components/admin/Analytics';

const AdminDashboard = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const menuItems = [
    { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Provider Approvals', icon: <VerifiedUserIcon />, path: '/admin/providers' },
    { text: 'Analytics', icon: <AssessmentIcon />, path: '/admin/analytics' },
    { text: 'Audit Logs', icon: <HistoryIcon />, path: '/admin/logs' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar title="Admin Dashboard" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <List component="nav" sx={{ py: 1 }}>
                {menuItems.map((item, index) => (
                  <React.Fragment key={item.text}>
                    <ListItemButton
                      selected={selectedIndex === index}
                      onClick={() => {
                        setSelectedIndex(index);
                        navigate(item.path);
                      }}
                      sx={{
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 1.5,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        },
                        '&:hover': {
                          bgcolor: selectedIndex === index ? 'primary.dark' : 'primary.lighter',
                        },
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          color: selectedIndex === index ? 'white' : 'primary.main',
                          minWidth: 40
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: selectedIndex === index ? 700 : 600,
                          fontSize: '0.95rem'
                        }}
                      />
                    </ListItemButton>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                minHeight: '500px',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Routes>
                <Route path="/" element={<UserManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/providers" element={<ProviderApproval />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/logs" element={<AuditLogs />} />
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
