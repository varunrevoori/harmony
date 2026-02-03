import React, { useState, useEffect } from 'react';
import { Typography, Box, Tabs, Tab, Tooltip, Chip } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import AppointmentCard from '../common/AppointmentCard';
import Loader from '../common/Loader';
import RescheduleModal from './RescheduleModal';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [tab]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = tab === 0 ? { upcoming: 'true' } : {};
      const response = await axios.get('/user/appointments', { params });
      console.log('Appointments response:', response.data);
      const data = response.data.data?.appointments || response.data.appointments || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch appointments error:', error);
      toast.error('Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointment) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.put(`/user/appointments/${appointment._id}/cancel`, { reason: 'Cancelled by user' });
        toast.success('Appointment cancelled');
        fetchAppointments();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel');
      }
    }
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSuccess = (updatedAppointment) => {
    fetchAppointments();
  };

  const handleAction = (action, appointment) => {
    if (action === 'cancel') {
      handleCancel(appointment);
    } else if (action === 'reschedule') {
      handleReschedule(appointment);
    }
  };

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
        My Appointments
      </Typography>
      <Tabs 
        value={tab} 
        onChange={(e, newValue) => setTab(newValue)} 
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0'
          }
        }}
      >
        <Tab 
          label="Upcoming" 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.95rem',
            textTransform: 'none',
            minWidth: 120
          }}
        />
        <Tab 
          label="All" 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.95rem',
            textTransform: 'none',
            minWidth: 120
          }}
        />
      </Tabs>
      
      {loading ? (
        <Loader />
      ) : !Array.isArray(appointments) || appointments.length === 0 ? (
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
            No appointments found
          </Typography>
        </Box>
      ) : (
        <Box>
          {appointments.map((appointment) => {
            const canReschedule = appointment.status === 'APPROVED' && 
                                  (appointment.rescheduleCount || 0) < (appointment.rescheduleLimit || 2);
            
            const actionButtons = [];
            
            if (appointment.status === 'APPROVED' && canReschedule) {
              actionButtons.push({ 
                label: 'Reschedule', 
                action: 'reschedule', 
                color: 'primary', 
                variant: 'outlined' 
              });
            }
            
            if (['REQUESTED', 'APPROVED'].includes(appointment.status)) {
              actionButtons.push({ 
                label: 'Cancel', 
                action: 'cancel', 
                color: 'error', 
                variant: 'outlined' 
              });
            }
            
            return (
              <Box key={appointment._id} sx={{ position: 'relative' }}>
                {appointment.rescheduleCount > 0 && (
                  <Tooltip title={`Rescheduled ${appointment.rescheduleCount} time${appointment.rescheduleCount > 1 ? 's' : ''}`}>
                    <Chip
                      label={`Rescheduled ${appointment.rescheduleCount}x`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: 8,
                        zIndex: 1,
                        fontSize: '0.7rem'
                      }}
                    />
                  </Tooltip>
                )}
                <AppointmentCard
                  appointment={appointment}
                  onAction={handleAction}
                  actionButtons={actionButtons}
                />
              </Box>
            );
          })}
          
          <RescheduleModal
            open={rescheduleModalOpen}
            onClose={() => setRescheduleModalOpen(false)}
            appointment={selectedAppointment}
            onRescheduleSuccess={handleRescheduleSuccess}
          />
        </Box>
      )}
    </>
  );
};

export default MyAppointments;
