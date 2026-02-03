import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, CardActions, Button, Chip, Box, Rating, Stack } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';

const ProviderBrowser = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await axios.get('/user/providers');
      console.log('Providers response:', response.data);
      const data = response.data.data?.providers || response.data.providers || [];
      setProviders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to fetch providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Find Healthcare Providers
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Browse and book appointments with verified healthcare professionals
      </Typography>
      {!Array.isArray(providers) || providers.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          px: 3,
          bgcolor: 'grey.50',
          borderRadius: 4,
          border: '2px dashed',
          borderColor: 'grey.300'
        }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No providers found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later or try adjusting your search criteria
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {providers.map((provider) => (
          <Grid item xs={12} sm={6} md={4} key={provider._id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              overflow: 'visible'
            }}>
              <Box sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1
              }}>
                <Chip 
                  label={provider.serviceType || 'Healthcare'} 
                  size="small" 
                  color="primary"
                  sx={{ 
                    fontWeight: 600,
                    boxShadow: 1
                  }} 
                />
              </Box>

              <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 1, pr: 8 }}>
                  {provider.businessName}
                </Typography>

                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 2 }}>
                  <Rating 
                    value={provider.rating?.average || 0} 
                    readOnly 
                    size="small"
                    precision={0.5}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {provider.rating?.average || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({provider.rating?.count || 0})
                  </Typography>
                </Stack>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.6
                  }}
                >
                  {provider.description}
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: 'success.main'
                    }}>
                      <AttachMoneyIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Starting from
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                        ${provider.pricing?.basePrice || 0}
                      </Typography>
                    </Box>
                  </Box>

                  {provider.location?.city && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: 'rgba(45, 212, 191, 0.1)',
                        color: 'primary.main'
                      }}>
                        <LocationOnIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Location
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {provider.location.city}, {provider.location.state}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>

              <CardActions sx={{ p: 2.5, pt: 0 }}>
                <Button 
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/dashboard/book', { state: { provider } })}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}
                >
                  Book Appointment
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

export default ProviderBrowser;
