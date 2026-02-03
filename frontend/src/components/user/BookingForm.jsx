import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Grid, MenuItem, Box, Chip } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import { useLocation } from 'react-router-dom';

const BookingForm = () => {
  const location = useLocation();
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(location.state?.provider || null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    providerId: selectedProvider?._id || '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

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
    }
  };

  const handleCheckAvailability = async () => {
    if (!formData.providerId || !formData.date) {
      toast.error('Please select provider and date');
      return;
    }

    try {
      console.log('Checking availability for:', {
        providerId: formData.providerId,
        date: formData.date
      });
      
      const response = await axios.post('/user/compute-availability', {
        providerId: formData.providerId,
        date: formData.date
      });
      
      console.log('Availability response:', response.data);
      
      const data = response.data.data || {};
      const slots = data.availableSlots || [];
      
      setAvailableSlots(Array.isArray(slots) ? slots : []);
      
      if (!Array.isArray(slots) || slots.length === 0) {
        const message = data.message || 'No slots available for selected date';
        toast.info(message);
      } else {
        toast.success(`${slots.length} slot(s) available`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to check availability';
      toast.error(errorMsg);
      console.error('Error checking availability:', error);
      setAvailableSlots([]);
    }
  };

  const handleSlotSelect = (slot) => {
    setFormData({ ...formData, startTime: slot.startTime, endTime: slot.endTime });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/user/appointment', formData);
      toast.success('Appointment requested successfully');
      setFormData({ providerId: '', date: '', startTime: '', endTime: '', notes: '' });
      setAvailableSlots([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Book Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a provider, choose your preferred date and time slot
        </Typography>
      </Box>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ 
        bgcolor: 'white',
        p: 4,
        borderRadius: 3,
        boxShadow: 1
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Select Provider"
              value={formData.providerId}
              onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
              required
            >
              {Array.isArray(providers) && providers.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.businessName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Select Date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={handleCheckAvailability} 
              size="large"
              sx={{ 
                height: '56px',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              Check Availability
            </Button>
          </Grid>

          {Array.isArray(availableSlots) && availableSlots.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Available Time Slots
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {availableSlots.map((slot, index) => (
                  <Chip
                    key={index}
                    label={`${slot.startTime} - ${slot.endTime}`}
                    onClick={() => handleSlotSelect(slot)}
                    color={formData.startTime === slot.startTime ? 'primary' : 'default'}
                    clickable
                    sx={{
                      py: 2.5,
                      px: 1,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: formData.startTime === slot.startTime ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      },
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={!formData.startTime}
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                minWidth: 200
              }}
            >
              Request Appointment
            </Button>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default BookingForm;
