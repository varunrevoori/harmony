import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, Box, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CancelIcon from '@mui/icons-material/Cancel';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';

const Analytics = () => {
  const [utilization, setUtilization] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [utilizationRes, cancellationRes] = await Promise.all([
        axios.get('/admin/analytics/provider-utilization'),
        axios.get('/admin/analytics/cancellation-ranking')
      ]);
      const utilizationData = utilizationRes.data.data || utilizationRes.data.utilization;
      const cancellationData = cancellationRes.data.data || cancellationRes.data.rankings;
      setUtilization(Array.isArray(utilizationData) ? utilizationData : []);
      setCancellations(Array.isArray(cancellationData) ? cancellationData : []);
    } catch (error) {
      console.error('Fetch analytics error:', error);
      toast.error('Failed to fetch analytics');
      setUtilization([]);
      setCancellations([]);
    } finally {
      setLoading(false);
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
        Analytics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
              }
            }}
          >
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'success.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5
                  }}
                >
                  <TrendingUpIcon sx={{ color: 'success.main' }} />
                </Box>
                <Typography 
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Top Provider Utilization
                </Typography>
              </Box>
              {!Array.isArray(utilization) || utilization.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No data available</Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {utilization.slice(0, 5).map((item, index) => (
                    <Box key={index} sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.businessName}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {item.utilizationRate}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={item.utilizationRate} 
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: 'success.main'
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
              }
            }}
          >
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'error.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5
                  }}
                >
                  <CancelIcon sx={{ color: 'error.main' }} />
                </Box>
                <Typography 
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Most Cancellations
                </Typography>
              </Box>
              {!Array.isArray(cancellations) || cancellations.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No data available</Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {cancellations.map((item, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.5,
                        px: 2,
                        mb: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'error.main',
                          bgcolor: 'error.lighter',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1
                        }}
                      >
                        {item.cancellationCount}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Analytics;
