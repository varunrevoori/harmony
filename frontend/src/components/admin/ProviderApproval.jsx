import React, { useState, useEffect } from 'react';
import { Typography, Card, CardContent, CardActions, Button, Grid, Chip, Box } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';

const ProviderApproval = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const response = await axios.get('/admin/providers/pending');
      console.log('Pending providers response:', response.data);
      const data = response.data.data?.providers || response.data.providers || [];
      setProviders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch providers error:', error);
      toast.error('Failed to fetch pending providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put(`/admin/providers/${userId}/approve`);
      toast.success('Provider approved');
      fetchPendingProviders();
    } catch (error) {
      toast.error('Failed to approve provider');
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason) {
      try {
        await axios.put(`/admin/providers/${userId}/reject`, { reason });
        toast.success('Provider rejected');
        fetchPendingProviders();
      } catch (error) {
        toast.error('Failed to reject provider');
      }
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
        Provider Approvals
      </Typography>
      {providers.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 6,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <Typography 
            variant="body1" 
            color="textSecondary"
            sx={{ fontWeight: 500 }}
          >
            No pending approvals
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {providers.map((provider) => (
            <Grid item xs={12} md={6} key={provider._id}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    {provider.name}
                  </Typography>
                  <Typography 
                    color="textSecondary"
                    sx={{ fontSize: '0.9rem', mb: 1.5 }}
                  >
                    {provider.email}
                  </Typography>
                  <Chip 
                    label={provider.role} 
                    size="small" 
                    color="primary"
                    sx={{ 
                      fontWeight: 600,
                      borderRadius: 1.5
                    }}
                  />
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="contained"
                    color="success" 
                    onClick={() => handleApprove(provider._id)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      px: 2
                    }}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="error" 
                    onClick={() => handleReject(provider._id)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      px: 2
                    }}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};

export default ProviderApproval;
