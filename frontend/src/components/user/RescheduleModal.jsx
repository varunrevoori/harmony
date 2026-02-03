import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const RescheduleModal = ({ open, onClose, appointment, onRescheduleSuccess }) => {
  const [newDate, setNewDate] = useState(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [isLateReschedule, setIsLateReschedule] = useState(false);

  // Calculate if this would be a late reschedule
  useEffect(() => {
    if (appointment) {
      const appointmentDateTime = new Date(`${appointment.date.split('T')[0]}T${appointment.startTime}`);
      const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setIsLateReschedule(appointmentDateTime < twentyFourHoursFromNow);
    }
  }, [appointment]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (newDate && appointment) {
      fetchAvailableSlots();
    }
  }, [newDate]);

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setError('');
    
    try {
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      const response = await api.get(
        `/user/availability/${appointment.providerId}?date=${formattedDate}`
      );
      
      if (response.data.success) {
        setAvailableSlots(response.data.data.availableSlots || []);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setNewStartTime(slot.startTime);
    setNewEndTime(slot.endTime);
  };

  const handleReschedule = async () => {
    if (!newDate || !newStartTime || !newEndTime) {
      setError('Please select a date and time slot');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.put(`/user/appointments/${appointment._id}/reschedule`, {
        newDate: format(newDate, 'yyyy-MM-dd'),
        newStartTime,
        newEndTime,
        reason
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onRescheduleSuccess(response.data.data.appointment);
        handleClose();
      }
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      const errorMsg = err.response?.data?.message || 'Failed to reschedule appointment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewDate(null);
    setNewStartTime('');
    setNewEndTime('');
    setReason('');
    setError('');
    setAvailableSlots([]);
    onClose();
  };

  if (!appointment) return null;

  const remainingReschedules = (appointment.rescheduleLimit || 2) - (appointment.rescheduleCount || 0);
  const minDate = addDays(new Date(), 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventRepeatIcon color="primary" />
            <Typography variant="h6">Reschedule Appointment</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Appointment
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2">
                <strong>Date:</strong> {format(new Date(appointment.date), 'MMM dd, yyyy')}
              </Typography>
              <Typography variant="body2">
                <strong>Time:</strong> {appointment.startTime} - {appointment.endTime}
              </Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {appointment.appointmentId}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${remainingReschedules} reschedule${remainingReschedules !== 1 ? 's' : ''} remaining`}
                size="small"
                color={remainingReschedules > 0 ? 'success' : 'error'}
              />
              {appointment.rescheduleCount > 0 && (
                <Chip 
                  label={`Rescheduled ${appointment.rescheduleCount}x`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            {isLateReschedule && (
              <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
                This is a late reschedule (less than 24 hours notice). The provider may need to re-approve your request.
              </Alert>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <DatePicker
              label="New Date"
              value={newDate}
              onChange={setNewDate}
              minDate={minDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </Box>

          {newDate && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Time Slots
              </Typography>
              
              {loadingSlots ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : availableSlots.length === 0 ? (
                <Alert severity="info">
                  No available slots for this date. Please select another date.
                </Alert>
              ) : (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1
                }}>
                  {availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={
                        newStartTime === slot.startTime && newEndTime === slot.endTime
                          ? 'contained'
                          : 'outlined'
                      }
                      size="small"
                      onClick={() => handleSlotSelect(slot)}
                      sx={{ 
                        fontSize: '0.75rem',
                        py: 1,
                        justifyContent: 'center'
                      }}
                    >
                      {slot.startTime}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {newStartTime && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected: {newStartTime} - {newEndTime}
            </Alert>
          )}

          <TextField
            label="Reason for Rescheduling (Optional)"
            multiline
            rows={3}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let the provider know why you need to reschedule..."
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            variant="contained"
            disabled={loading || !newDate || !newStartTime || !newEndTime}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default RescheduleModal;
