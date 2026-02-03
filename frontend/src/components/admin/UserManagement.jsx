import React, { useState, useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/api';
import Loader from '../common/Loader';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin/users');
      console.log('Users response:', response.data);
      const data = response.data.data?.users || response.data.users || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await axios.delete(`/admin/users/${userId}`);
        toast.success('User deactivated');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to deactivate user');
      }
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
        User Management
      </Typography>
      {!Array.isArray(users) || users.length === 0 ? (
        <Typography variant="body1" color="textSecondary">No users found</Typography>
      ) : (
        <TableContainer 
          sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user._id}
                sx={{
                  '&:hover': {
                    bgcolor: 'grey.50'
                  }
                }}
              >
                <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    size="small" 
                    sx={{ 
                      fontWeight: 600,
                      borderRadius: 1.5
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.isActive ? 'Active' : 'Inactive'} 
                    color={user.isActive ? 'success' : 'default'} 
                    size="small"
                    sx={{ 
                      fontWeight: 600,
                      borderRadius: 1.5
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeactivate(user._id)} 
                    disabled={!user.isActive}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 1.5
                    }}
                  >
                    Deactivate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default UserManagement;
