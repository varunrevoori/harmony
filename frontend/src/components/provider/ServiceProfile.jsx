import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Grid, Box, Paper } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';

const ServiceProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/provider/profile');
      setProfile(response.data.data || response.data.provider || {});
    } catch (error) {
      toast.error('Failed to fetch profile');
      setProfile({});
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/provider/profile', profile);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Typography 
        variant="h5" 
        gutterBottom
        sx={{ 
          fontWeight: 800,
          letterSpacing: '-0.02em',
          mb: 3
        }}
      >
        Service Profile
      </Typography>
      <Box 
        component="form" 
        onSubmit={handleUpdate}
        sx={{
          bgcolor: 'white',
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Name"
              value={profile?.businessName || ''}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={profile?.description || ''}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'none'
              }}
            >
              Update Profile
            </Button>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default ServiceProfile;
