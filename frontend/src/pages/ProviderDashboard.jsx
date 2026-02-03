import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
  Divider
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonIcon from '@mui/icons-material/Person';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Navbar from '../components/common/Navbar';
import AvailabilityCalendar from '../components/provider/AvailabilityCalendar';
import AppointmentRequests from '../components/provider/AppointmentRequests';
import ServiceProfile from '../components/provider/ServiceProfile';
import ProviderStats from '../components/provider/ProviderStats';

const ProviderDashboard = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Appointments', icon: <EventNoteIcon />, path: '/provider/appointments' },
    { text: 'Availability', icon: <CalendarMonthIcon />, path: '/provider/availability' },
    { text: 'Profile', icon: <PersonIcon />, path: '/provider/profile' },
    { text: 'Statistics', icon: <AssessmentIcon />, path: '/provider/stats' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar title="Provider Dashboard" />
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
                <Route path="/" element={<AppointmentRequests />} />
                <Route path="/appointments" element={<AppointmentRequests />} />
                <Route path="/availability" element={<AvailabilityCalendar />} />
                <Route path="/profile" element={<ServiceProfile />} />
                <Route path="/stats" element={<ProviderStats />} />
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProviderDashboard;
