import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { Container, Grid, Paper, TextField, Typography, Button, Alert, Box } from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function AnalyticsPage() {
  const [latestReport, setLatestReport] = useState(null);
  const [caps, setCaps] = useState([]);
  const [workloads, setWorkloads] = useState([]);

  const [orderId, setOrderId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [qty, setQty] = useState(0);
  const [dist, setDist] = useState({ shopfloor1: 0, shopfloor2: 0, shopfloor3: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/api/reports')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setLatestReport(res.data[res.data.length - 1]);
        } else {
          setLatestReport(null);
        }
      })
      .catch(() => setLatestReport(null));
    api.get('/api/capacities').then(r => setCaps(Array.isArray(r.data) ? r.data : [])).catch(() => setCaps([]));
    api.get('/api/workloads').then(r => setWorkloads(Array.isArray(r.data) ? r.data : [])).catch(() => setWorkloads([]));
  }, []);

  const capacitiesMap = useMemo(() => Object.fromEntries(caps.map(c => [c.shopfloor, Number(c.capacity) || 0])), [caps]);
  const workloadsMap = useMemo(() => Object.fromEntries(workloads.map(w => [w.shopfloor, Number(w.workload) || 0])), [workloads]);

  const remainingCapacity = (sf) => Math.max(0, (capacitiesMap[sf] ?? 0) - (workloadsMap[sf] ?? 0));

  const handleDistribute = async () => {
    setError('');
    setSuccess('');
    const total = Number(dist.shopfloor1) + Number(dist.shopfloor2) + Number(dist.shopfloor3);
    if (!orderId || !materialId || Number(qty) <= 0) {
      setError('Please fill Order ID, Material ID, and positive Quantity');
      return;
    }
    if (total !== Number(qty)) {
      setError('Sum of distribution must equal Total Quantity');
      return;
    }
    for (const sf of ['shopfloor1','shopfloor2','shopfloor3']) {
      if (Number(dist[sf]) < 0) {
        setError('Distribution values cannot be negative');
        return;
      }
      if (Number(dist[sf]) > remainingCapacity(sf)) {
        setError(`Distribution for ${sf} exceeds remaining capacity (${remainingCapacity(sf)})`);
        return;
      }
    }

    const order = {
      ProductionScheduleID: orderId,
      Product: { MaterialID: materialId },
      Quantity: { Requested: Number(qty), Unit: 'bottles' },
    };
    try {
      await api.post('/api/distribute-load', {
        order,
        distribution: {
          shopfloor1: Number(dist.shopfloor1),
          shopfloor2: Number(dist.shopfloor2),
          shopfloor3: Number(dist.shopfloor3),
        },
      });
      setSuccess('Order sent to shopfloors');
      setOrderId('');
      setMaterialId('');
      setQty(0);
      setDist({ shopfloor1: 0, shopfloor2: 0, shopfloor3: 0 });
      // refresh workloads after distribution
      const w = await api.get('/api/workloads');
      setWorkloads(Array.isArray(w.data) ? w.data : []);
    } catch (e) {
      setError('Capacity exceeds or distribution failed');
    }
  };

  const noReport = !latestReport;

  const safeEquipment = Array.isArray(latestReport?.EquipmentUsed) ? latestReport.EquipmentUsed : [];
  const producedTotal = Number(latestReport?.Quantity?.Produced) || 0;
  const defectiveTotal = Number(latestReport?.Quantity?.Defective) || 0;

  const pieData = {
    labels: safeEquipment,
    datasets: [
      {
        label: 'Order Split',
        data: safeEquipment.length > 0
          ? safeEquipment.map(() => Math.round((producedTotal + defectiveTotal) / safeEquipment.length))
          : [],
        backgroundColor: ['#2196f3', '#ff9800', '#4caf50'],
      },
    ],
  };

  const barData = {
    labels: safeEquipment,
    datasets: [
      {
        label: 'Produced',
        data: safeEquipment.length > 0 ? safeEquipment.map(() => producedTotal / safeEquipment.length) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Defective',
        data: safeEquipment.length > 0 ? safeEquipment.map(() => defectiveTotal / safeEquipment.length) : [],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      },
    ],
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5">📊 ERP-MES Analytics Dashboard</Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Distribute New Order</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Order ID" fullWidth value={orderId} onChange={e => setOrderId(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Material ID" fullWidth value={materialId} onChange={e => setMaterialId(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Total Quantity" type="number" fullWidth value={qty} onChange={e => setQty(e.target.value)} />
              </Grid>
              {['shopfloor1','shopfloor2','shopfloor3'].map(sf => (
                <Grid item xs={12} sm={4} key={sf}>
                  <TextField
                    label={`${sf} (cap rem: ${remainingCapacity(sf)})`}
                    type="number"
                    fullWidth
                    value={dist[sf]}
                    onChange={e => setDist(prev => ({ ...prev, [sf]: Number(e.target.value) }))}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleDistribute}>Distribute</Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Latest Order Overview</Typography>
            {noReport ? (
              <Box>No report data available yet.</Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ width: '50%' }}>
                  <Typography variant="body2" gutterBottom>Order Distribution</Typography>
                  <Pie data={pieData} />
                </Box>
                <Box sx={{ width: '50%' }}>
                  <Typography variant="body2" gutterBottom>Produced vs Defective</Typography>
                  <Bar data={barData} />
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AnalyticsPage;
