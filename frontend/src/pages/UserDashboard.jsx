import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Navbar from '../components/common/Navbar';
import ProviderBrowser from '../components/user/ProviderBrowser';
import MyAppointments from '../components/user/MyAppointments';
import BookingForm from '../components/user/BookingForm';

const UserDashboard = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Find Providers', icon: <SearchIcon />, path: '/dashboard/browse' },
    { text: 'Book Appointment', icon: <AddBoxIcon />, path: '/dashboard/book' },
    { text: 'My Appointments', icon: <EventNoteIcon />, path: '/dashboard/appointments' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar title="User Dashboard" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper elevation={0} sx={{ 
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <List component="nav">
                {menuItems.map((item, index) => (
                  <React.Fragment key={item.text}>
                    <ListItemButton
                      selected={selectedIndex === index}
                      onClick={() => {
                        setSelectedIndex(index);
                        navigate(item.path);
                      }}
                      sx={{
                        py: 2,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          }
                        },
                        '&:hover': {
                          bgcolor: 'rgba(45, 212, 191, 0.08)',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: selectedIndex === index ? 700 : 600,
                          fontSize: '0.95rem'
                        }}
                      />
                    </ListItemButton>
                    {index < menuItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9}>
            <Paper elevation={0} sx={{ 
              p: 4, 
              minHeight: '500px',
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 3
            }}>
              <Routes>
                <Route path="/" element={<ProviderBrowser />} />
                <Route path="/browse" element={<ProviderBrowser />} />
                <Route path="/book" element={<BookingForm />} />
                <Route path="/appointments" element={<MyAppointments />} />
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default UserDashboard;
