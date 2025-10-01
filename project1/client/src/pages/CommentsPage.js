import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Tabs, Tab, List, ListItem, ListItemText, TextField, Button } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import api from '../api';

const floors = ['shopfloor1', 'shopfloor2', 'shopfloor3'];

export default function CommentsPage() {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderOptions, setOrderOptions] = useState([]);

  const load = async () => {
    const floor = floors[tab];
    try {
      const r = await api.get(`/api/comments/shopfloors`, { params: { shopfloor: floor } });
      setItems(Array.isArray(r.data) ? r.data : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [tab]);

  // Load ERP order IDs for dropdown once
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/reports/erp');
        const ids = Array.isArray(r.data) ? Array.from(new Set(r.data.map(o => o?.ProductionScheduleID).filter(Boolean))) : [];
        setOrderOptions(ids);
      } catch {
        setOrderOptions([]);
      }
    })();
  }, []);

  const submit = async () => {
    const floor = floors[tab];
    if (!newComment.trim()) return;
    const comment = newComment.trim();
    if (orderId.trim()) {
      // Order-specific feedback flows into the same comments feed
      await api.post(`/api/comments/shopfloors/order`, { shopfloor: floor, orderId: orderId.trim(), comment });
    } else {
      // Shopfloor-wide comment remains supported
      await api.post(`/api/shopfloors/${floor}/comment`, { comment });
    }
    setNewComment('');
    setOrderId('');
    await load();
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Shopfloor Comments</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {floors.map(f => <Tab key={f} label={f} />)}
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField sx={{ flex: 2, minWidth: 220 }} placeholder="Write a comment" value={newComment} onChange={e => setNewComment(e.target.value)} />
        <Autocomplete
          sx={{ flex: 1, minWidth: 220 }}
          options={orderOptions}
          freeSolo
          value={orderId}
          onInputChange={(_, v) => setOrderId(v)}
          renderInput={(params) => <TextField {...params} label="Order ID" />}
        />
        <Button variant="contained" onClick={submit}>Send Feedback</Button>
      </Box>

      <List sx={{ mt: 2 }}>
        {items.map((c, idx) => (
          <ListItem key={idx} divider>
            <ListItemText
              primary={c.comment}
              secondary={`Order: ${c.orderId || '-'} • ${c.shopfloor || floors[tab]} • ${c.username || 'unknown'} • ${c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}`}
            />
          </ListItem>
        ))}
        {items.length === 0 && (
          <ListItem>
            <ListItemText primary="No comments yet." />
          </ListItem>
        )}
      </List>
    </Container>
  );
}


