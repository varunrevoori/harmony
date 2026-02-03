import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';

const ProviderStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/provider/stats');
      setStats(response.data.data || {});
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Statistics Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none'
          }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.9, fontSize: '0.875rem', fontWeight: 600 }}>
                Total Appointments
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 2 }}>
                {stats?.totalAppointments || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                All time appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            border: 'none'
          }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.9, fontSize: '0.875rem', fontWeight: 600 }}>
                Completed
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 2 }}>
                {stats?.completedAppointments || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Successfully finished
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            border: 'none'
          }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.9, fontSize: '0.875rem', fontWeight: 600 }}>
                Pending
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 2 }}>
                {stats?.pendingAppointments || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Awaiting action
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            border: 'none'
          }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.9, fontSize: '0.875rem', fontWeight: 600 }}>
                Utilization Rate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 2 }}>
                {stats?.utilizationRate || 0}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Current efficiency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ProviderStats;
