import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Grid, MenuItem, Box, IconButton, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';
import { format, addDays, startOfWeek } from 'date-fns';

const AvailabilityCalendar = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00'
  });

  // Helper to get next occurrence of a day
  const getNextOccurrence = (dayName) => {
    const daysMap = {
      'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
      'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
    };
    const targetDay = daysMap[dayName];
    const today = new Date();
    const currentDay = today.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) daysToAdd += 7;
    if (daysToAdd === 0) daysToAdd = 7; // Next week if today
    return addDays(today, daysToAdd);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await axios.get('/provider/availability');
      console.log('Availability response:', response.data);
      const data = response.data.data?.rules || response.data.rules || [];
      setRules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch availability error:', error);
      toast.error('Failed to fetch availability');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Check if rule already exists for this day
      const existingRule = rules.find(rule => rule.dayOfWeek === formData.dayOfWeek);
      
      if (existingRule) {
        // Update existing rule by adding new time slot
        const updatedTimeSlots = [
          ...existingRule.timeSlots,
          { startTime: formData.startTime, endTime: formData.endTime }
        ];
        
        await axios.put(`/provider/availability/${existingRule._id}`, {
          timeSlots: updatedTimeSlots
        });
        toast.success('Availability updated');
      } else {
        // Create new rule
        await axios.post('/provider/availability', {
          dayOfWeek: formData.dayOfWeek,
          timeSlots: [{ startTime: formData.startTime, endTime: formData.endTime }]
        });
        toast.success('Availability added');
      }
      
      fetchRules();
    } catch (error) {
      console.error('Add availability error:', error);
      toast.error(error.response?.data?.message || 'Failed to add availability');
    }
  };

  const handleDeleteSlot = async (ruleId, slotIndex) => {
    try {
      const rule = rules.find(r => r._id === ruleId);
      if (!rule) return;

      const updatedTimeSlots = rule.timeSlots.filter((_, index) => index !== slotIndex);
      
      if (updatedTimeSlots.length === 0) {
        // If no slots left, deactivate the rule
        await axios.put(`/provider/availability/${ruleId}`, {
          timeSlots: rule.timeSlots,
          isActive: false
        });
        toast.success('Availability rule deactivated');
      } else {
        await axios.put(`/provider/availability/${ruleId}`, {
          timeSlots: updatedTimeSlots
        });
        toast.success('Time slot removed');
      }
      
      fetchRules();
    } catch (error) {
      console.error('Delete slot error:', error);
      toast.error('Failed to remove time slot');
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
        Availability Management
      </Typography>
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          mb: 4,
          p: 3,
          bgcolor: 'white',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Day"
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
            >
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="time"
              label="Start Time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="time"
              label="End Time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              fullWidth 
              variant="contained" 
              type="submit" 
              sx={{ 
                height: '56px',
                fontWeight: 700,
                textTransform: 'none'
              }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Typography 
        variant="h6" 
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: 2
        }}
      >
        Current Availability
      </Typography>
      {!Array.isArray(rules) || rules.length === 0 ? (
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
            No availability rules set
          </Typography>
        </Box>
      ) : (
        rules.filter(rule => rule.isActive !== false).map((rule) => (
          <Box 
            key={rule._id} 
            sx={{ 
              mb: 2, 
              p: 2.5, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'white',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 2
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Typography 
                variant="body1"
                sx={{ 
                  fontWeight: 700,
                  color: 'primary.main'
                }}
              >
                {rule.dayOfWeek}
              </Typography>
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
                label={`Next: ${format(getNextOccurrence(rule.dayOfWeek), 'MMM dd, yyyy')}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.75rem',
                  height: 24,
                  borderRadius: 1.5
                }}
              />
            </Box>
            {Array.isArray(rule.timeSlots) && rule.timeSlots.map((slot, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  py: 1,
                  px: 2,
                  mb: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography 
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  {slot.startTime} - {slot.endTime}
                </Typography>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => handleDeleteSlot(rule._id, index)}
                  aria-label="delete"
                  sx={{
                    '&:hover': {
                      bgcolor: 'error.lighter'
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ))
      )}
    </>
  );
};

export default AvailabilityCalendar;
