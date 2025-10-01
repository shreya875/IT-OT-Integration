import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Box, Tabs, Tab } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api';

const floors = ['shopfloor1', 'shopfloor2', 'shopfloor3'];

export default function ShopfloorsPage() {
  const [tab, setTab] = useState(0);
  const [raw, setRaw] = useState([]);
  const [info, setInfo] = useState('');
  const [rowDrafts, setRowDrafts] = useState({}); // id -> draft comment

  useEffect(() => {
    const fetchData = () => {
      const floor = floors[tab];
      api.get('/api/reports/shopfloors', { params: { shopfloor: floor } })
        .then(r => {
          const data = Array.isArray(r.data) ? r.data : [];
          if (data.length === 0) {
            // Fallback: fetch all and filter client-side in case shopfloor tag is missing
            return api.get('/api/reports/shopfloors').then(all => {
              const allData = Array.isArray(all.data) ? all.data : [];
              setRaw(allData.filter(x => (x.shopfloor || floor) === floor));
              setInfo(`Fetched ${allData.length} reports (filtered for ${floor}).`);
            });
          } else {
            setRaw(data);
            setInfo(`Fetched ${data.length} reports for ${floor}.`);
          }
        })
        .catch(err => {
          setRaw([]);
          setInfo(err?.response?.status === 401 ? 'Unauthorized - please login again.' : 'Fetch failed');
        });
    };
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => { clearInterval(id); };
  }, [tab]);

  const columns = useMemo(() => ([
    { field: 'orderId', headerName: 'Order ID', width: 160 },
    { field: 'equipment', headerName: 'Equipment', width: 150 },
    { field: 'produced', headerName: 'Produced', width: 130 },
    { field: 'defective', headerName: 'Defective', width: 130 },
    { field: 'receivedAt', headerName: 'Received At', width: 200 },
    { field: 'comment', headerName: 'Comment', width: 320, renderCell: (params) => {
        const rowId = params.row._docId;
        const value = rowDrafts[rowId] || '';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <input
              style={{ flex: 1 }}
              placeholder={Array.isArray(params.row.comments) && params.row.comments.length > 0 ? `Latest: ${params.row.comments[0].comment}` : 'Add a comment'}
              value={value}
              onChange={(e) => setRowDrafts(prev => ({ ...prev, [rowId]: e.target.value }))}
            />
            <button onClick={async () => {
              const draft = (rowDrafts[rowId] || '').trim();
              if (!draft) return;
              await api.post(`/api/reports/shopfloors/${rowId}/comment`, { comment: draft });
              setRowDrafts(prev => ({ ...prev, [rowId]: '' }));
              // refresh this row's comments
              const floor = floors[tab];
              const r = await api.get('/api/reports/shopfloors', { params: { shopfloor: floor } });
              const data = Array.isArray(r.data) ? r.data : [];
              setRaw(data);
            }}>Save</button>
          </Box>
        );
      }
    },
  ]), [tab, rowDrafts, raw]);

  const rowsFor = (floor) => raw
    .filter(r => r.shopfloor === floor)
    .map((r, idx) => ({
      id: `${floor}-${idx}-${r.OrderID}`,
      _docId: r._id,
      orderId: r.OrderID,
      shopfloor: r.shopfloor || floor,
      equipment: r.Equipment,
      produced: r.Produced,
      defective: r.Defective,
      receivedAt: r.receivedAt ? new Date(r.receivedAt).toLocaleString() : '-',
      comments: Array.isArray(r.comments) ? r.comments : [],
    }));

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shopfloor Reports
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {floors.map(f => <Tab key={f} label={f} />)}
        </Tabs>
      </Box>

      <Box sx={{ height: 520, width: '100%', mt: 2 }}>
        <DataGrid
          rows={rowsFor(floors[tab])}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20]}
          localeText={{ noRowsLabel: 'No reports yet for this shopfloor.' }}
        />
      </Box>
    </Container>
  );
}


