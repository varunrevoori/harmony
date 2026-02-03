import React, { useState, useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';
import { format } from 'date-fns';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/admin/audit-logs', { params: { limit: 100 } });
      console.log('Audit logs response:', response.data);
      const data = response.data.data?.logs || response.data.logs || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch logs error:', error);
      toast.error('Failed to fetch audit logs');
      setLogs([]);
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
        Audit Logs
      </Typography>
      <TableContainer 
        sx={{ 
          maxHeight: 600,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  bgcolor: 'grey.50'
                }}
              >
                Timestamp
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  bgcolor: 'grey.50'
                }}
              >
                Action
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  bgcolor: 'grey.50'
                }}
              >
                Actor
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  bgcolor: 'grey.50'
                }}
              >
                Entity Type
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow 
                key={log._id}
                sx={{
                  '&:hover': {
                    bgcolor: 'grey.50'
                  }
                }}
              >
                <TableCell sx={{ fontSize: '0.85rem' }}>
                  {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={log.action}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: 1.5
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>
                  {log.actor?.email || 'System'}
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>
                  {log.entity?.type}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default AuditLogs;
