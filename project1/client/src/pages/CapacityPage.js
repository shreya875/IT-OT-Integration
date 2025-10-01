import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Grid, TextField, Button, Box, Snackbar, Alert, Tabs, Tab } from '@mui/material';
import api from '../api';
import CommentsPage from './CommentsPage';
import StatusPage from './StatusPage';

export default function CapacityPage() {
  const [tab, setTab] = useState(0);
  const [caps, setCaps] = useState([
    { shopfloor: 'shopfloor1', capacity: 0 },
    { shopfloor: 'shopfloor2', capacity: 0 },
    { shopfloor: 'shopfloor3', capacity: 0 },
  ]);
  const [workloads, setWorkloads] = useState({});
  const loadCaps = () => api.get('/api/capacities').then(r => {
    const map = { shopfloor1: 0, shopfloor2: 0, shopfloor3: 0 };
    r.data.forEach(x => { map[x.shopfloor] = x.capacity; });
    setCaps([
      { shopfloor: 'shopfloor1', capacity: map.shopfloor1 },
      { shopfloor: 'shopfloor2', capacity: map.shopfloor2 },
      { shopfloor: 'shopfloor3', capacity: map.shopfloor3 },
    ]);
  });
  const loadWorkloads = () => api.get('/api/workloads').then(r => {
    const obj = {};
    r.data.forEach(x => { obj[x.shopfloor] = x.workload; });
    setWorkloads(obj);
  });

  useEffect(() => {
    loadCaps();
    loadWorkloads();
  }, []);

  const updateCap = (sf, val) => {
    setCaps(prev => prev.map(x => x.shopfloor === sf ? { ...x, capacity: val } : x));
  };

  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '' });

  const saveCaps = async () => {
    try {
      for (const c of caps) {
        await api.post('/api/capacities', { shopfloor: c.shopfloor, capacity: Number(c.capacity) });
      }
      await loadCaps();
      setSnack({ open: true, severity: 'success', message: 'Capacities saved successfully' });
    } catch (e) {
      setSnack({ open: true, severity: 'error', message: 'Failed to save capacities' });
    }
  };

  const resetWorkloads = async () => {
    await api.post('/api/workloads/reset');
    await loadWorkloads();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Shopfloor
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Capacity" />
            <Tab label="Comments" />
            <Tab label="Status" />
          </Tabs>
        </Box>

        {tab === 0 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {caps.map(c => (
                <Grid item xs={12} sm={4} key={c.shopfloor}>
                  <TextField
                    label={`${c.shopfloor} capacity`
                    }
                    type="number"
                    fullWidth
                    value={c.capacity}
                    onChange={e => updateCap(c.shopfloor, e.target.value)}
                  />
                  <Box sx={{ mt: 1, color: 'text.secondary' }}>
                    Current workload: {workloads[c.shopfloor] ?? 0}
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button variant="contained" onClick={saveCaps}>Save Capacities</Button>
              <Button variant="outlined" onClick={resetWorkloads}>Reset Workloads</Button>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            <CommentsPage />
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ mt: 2 }}>
            <StatusPage />
          </Box>
        )}
      </Paper>
    </Container>
  );
}


