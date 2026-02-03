import React, { useState, useEffect } from 'react';
import { Typography, Box, Button } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import AppointmentCard from '../common/AppointmentCard';
import Loader from '../common/Loader';

const AppointmentRequests = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/provider/appointments', { params: { status: 'REQUESTED' } });
      console.log('Provider appointments response:', response.data);
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

  const handleAction = async (action, appointment) => {
    try {
      if (action === 'approve') {
        await axios.put(`/provider/appointments/${appointment._id}/status`, {
          status: 'APPROVED'
        });
        toast.success('Appointment approved');
      } else if (action === 'reject') {
        const reason = window.prompt('Enter rejection reason:');
        if (reason) {
          await axios.put(`/provider/appointments/${appointment._id}/status`, {
            status: 'REJECTED',
            reason
          });
          toast.success('Appointment rejected');
        } else {
          return; // Don't proceed if no reason provided
        }
      }
      fetchAppointments();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Action failed';
      toast.error(errorMsg);
      console.error('Appointment action error:', error);
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
        Appointment Requests
      </Typography>
      {!Array.isArray(appointments) || appointments.length === 0 ? (
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
            No pending requests
          </Typography>
        </Box>
      ) : (
        <Box>
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onAction={handleAction}
              actionButtons={[
                { label: 'Approve', action: 'approve', color: 'success', variant: 'contained' },
                { label: 'Reject', action: 'reject', color: 'error', variant: 'outlined' }
              ]}
            />
          ))}
        </Box>
      )}
    </>
  );
};

export default AppointmentRequests;
