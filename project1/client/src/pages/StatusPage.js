// // src/pages/StatusPage.js
// import React, { useEffect, useState } from 'react';
// import api from '../api';

// function StatusPage() {
//   const [status, setStatus] = useState({});

//   useEffect(() => {
//     const fetchStatus = () => {
//       api.get('/status').then(res => setStatus(res.data));
//     };
//     fetchStatus();
//     const interval = setInterval(fetchStatus, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div>
//       <h2>Shopfloor Heartbeat Status</h2>
//       <ul>
//         {Object.entries(status).map(([floor, stat]) => (
//           <li key={floor}>
//             {floor.toUpperCase()}: <strong style={{ color: stat === 'UP' ? 'green' : 'red' }}>{stat}</strong>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default StatusPage;

// src/pages/StatusPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../api';

function StatusPage() {
  const [status, setStatus] = useState({});

  useEffect(() => {
    // Handle OAuth callback params: token, username, role
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    const role = params.get('role');
    if (token) {
      localStorage.setItem('token', token);
      if (username) localStorage.setItem('username', username);
      if (role) localStorage.setItem('role', role);
      // Clean the URL to remove sensitive params
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const fetchStatus = () => {
      api.get('/api/status')
        .then(res => setStatus(res.data))
        .catch(err => console.error("Status fetch failed", err));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Shopfloor Heartbeat Status
        </Typography>

        <List>
          {Object.entries(status).map(([floor, stat]) => (
            <ListItem key={floor}>
              <ListItemIcon>
                {stat === 'UP' ? (
                  <CheckCircleIcon sx={{ color: 'green' }} />
                ) : (
                  <CancelIcon sx={{ color: 'red' }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={floor.toUpperCase()}
                secondary={stat === 'UP' ? 'Online' : 'Disconnected'}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

export default StatusPage;

