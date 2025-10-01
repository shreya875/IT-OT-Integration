import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Grid, Paper, List, ListItemButton, ListItemText, Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/admin/users');
        setUsers(Array.isArray(r.data) ? r.data : []);
      } catch {
        setUsers([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedUser?.username) {
        setOrders([]);
        return;
      }
      setLoadingOrders(true);
      try {
        const r = await api.get('/api/admin/orders', { params: { username: selectedUser.username } });
        setOrders(Array.isArray(r.data) ? r.data : []);
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [selectedUser?.username]);

  const filteredUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.username || '').toLowerCase().includes(q));
  }, [users, filter]);

  const orderColumns = [
    { field: 'orderId', headerName: 'Order ID', width: 180 },
    { field: 'material', headerName: 'Material ID', width: 180 },
    { field: 'quantity', headerName: 'Requested Qty', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 200 },
  ];

  const orderRows = orders.map((o, idx) => ({
    id: idx,
    orderId: o?.ProductionScheduleID,
    material: o?.Product?.MaterialID ?? '-',
    quantity: typeof o?.Quantity === 'number' ? o.Quantity : (o?.Quantity?.Requested ?? '-'),
    createdAt: o?.createdAt ? new Date(o.createdAt).toLocaleString() : '-',
  }));

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Admin</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Users</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
              sx={{ mb: 1 }}
            />
            <List dense sx={{ maxHeight: 480, overflowY: 'auto' }}>
              {filteredUsers.map(u => (
                <ListItemButton
                  key={u._id}
                  selected={selectedUser?._id === u._id}
                  onClick={() => setSelectedUser(u)}
                >
                  <ListItemText primary={u.username} secondary={u.role} />
                </ListItemButton>
              ))}
              {filteredUsers.length === 0 && (
                <Box sx={{ p: 1, color: 'text.secondary' }}>No users</Box>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedUser ? `Orders by ${selectedUser.username}` : 'Select a user to view orders'}
            </Typography>
            <Box sx={{ height: 520 }}>
              <DataGrid
                loading={loadingOrders}
                rows={orderRows}
                columns={orderColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25]}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
