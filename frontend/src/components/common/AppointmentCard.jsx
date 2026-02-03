import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Divider,
  Stack
} from '@mui/material';
import { format } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const AppointmentCard = ({ appointment, onAction, actionButtons = [] }) => {
  const getStatusColor = (status) => {
    const colors = {
      REQUESTED: 'warning',
      APPROVED: 'info',
      IN_PROGRESS: 'primary',
      COMPLETED: 'success',
      CANCELLED: 'error',
      REJECTED: 'error',
      RESCHEDULED: 'secondary'
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  return (
    <Card 
      sx={{ 
        mb: 2.5,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: (theme) => {
            const color = getStatusColor(appointment.status);
            return `linear-gradient(90deg, ${theme.palette[color]?.main || theme.palette.primary.main}, ${theme.palette[color]?.light || theme.palette.primary.light})`;
          }
        }
      }}
    >
      <CardContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
              {appointment.appointmentId}
            </Typography>
            {appointment.serviceDetails && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {appointment.serviceDetails.serviceName}
                </Typography>
              </Box>
            )}
          </Box>
          <Chip
            label={appointment.status.replace('_', ' ')}
            color={getStatusColor(appointment.status)}
            size="small"
            sx={{ 
              fontWeight: 700,
              letterSpacing: '0.5px',
              height: 28,
              borderRadius: 2
            }}
          />
        </Box>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.lighter',
              color: 'primary.main'
            }}>
              <CalendarTodayIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatDate(appointment.date)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'secondary.lighter',
              color: 'secondary.main'
            }}>
              <AccessTimeIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                Time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {appointment.startTime} - {appointment.endTime}
              </Typography>
            </Box>
          </Box>

          {appointment.serviceDetails && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'success.lighter',
                color: 'success.main'
              }}>
                <AttachMoneyIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                  Price
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${appointment.serviceDetails.price}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>

        {appointment.notes && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 2,
            mb: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {appointment.notes}
            </Typography>
          </Box>
        )}

        {actionButtons.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {actionButtons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant || 'contained'}
                  color={button.color || 'primary'}
                  size="medium"
                  onClick={() => onAction(button.action, appointment)}
                  disabled={button.disabled}
                  sx={{
                    minWidth: 100,
                    fontWeight: 600,
                  }}
                >
                  {button.label}
                </Button>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
