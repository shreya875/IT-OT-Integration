
// // src/layouts/DashboardLayout.js

// import React, { useEffect, useState } from 'react';
// import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// import {
//   AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Box
// } from '@mui/material';

// import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
// import AssessmentIcon from '@mui/icons-material/Assessment';
// import SendIcon from '@mui/icons-material/Send';
// import BarChartIcon from '@mui/icons-material/BarChart';  // new icon for Analytics

// const drawerWidth = 200;

// export default function DashboardLayout() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const menuItems = [
//     { text: 'Status', icon: <MonitorHeartIcon />, path: '/status' },
//     { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
//     { text: 'Distribute', icon: <SendIcon />, path: '/distribute' },
//     { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' }, 
//   ];

//   return (
//     <Box sx={{ display: 'flex' }}>
//       {/* Sidebar */}
//       <Drawer
//         variant="permanent"
//         anchor="left"
//         sx={{
//           width: drawerWidth,
//           '& .MuiDrawer-paper': {
//             width: drawerWidth,
//             boxSizing: 'border-box',
//             backgroundColor: '#f4f4f4',
//           },
//         }}
//       >
//         <Toolbar />
//         <List>
//           {menuItems.map((item) => (
//             <ListItem
//               button
//               key={item.text}
//               selected={location.pathname === item.path}
//               onClick={() => navigate(item.path)}
//             >
//               <ListItemIcon>{item.icon}</ListItemIcon>
//               <ListItemText primary={item.text} />
//             </ListItem>
//           ))}
//         </List>
//       </Drawer>

//       {/* Main Content */}
//       <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
//         <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
//           <Toolbar>
//             <Typography variant="h6" noWrap>
//               MES Dashboard
//             </Typography>
//           </Toolbar>
//         </AppBar>
//         <Toolbar /> {/* for spacing below AppBar */}
//         <Outlet /> {/* Renders current page based on route */}
//       </Box>
//     </Box>
//   );
// }
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
} from '@mui/material';

import AssessmentIcon from '@mui/icons-material/Assessment';
import SendIcon from '@mui/icons-material/Send';
  import SettingsIcon from '@mui/icons-material/Settings';
  import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const drawerWidth = 200;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(localStorage.getItem('username') || 'User');
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');

  // Update username if it changes in localStorage (e.g., after OAuth callback)
  useEffect(() => {
    const syncUser = () => {
      setUsername(localStorage.getItem('username') || 'User');
      setRole(localStorage.getItem('role') || 'user');
    };
    window.addEventListener('storage', syncUser);
    // Also sync on mount in case it was set just before
    syncUser();
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const menuItems = [
    { text: 'ERP', icon: <AssessmentIcon />, path: '/erp' },
    { text: 'MES', icon: <SendIcon />, path: '/mes' },
    { text: 'Shopfloors', icon: <SettingsIcon />, path: '/shopfloors' },
    ...(role === 'admin' ? [{ text: 'Admin', icon: <AdminPanelSettingsIcon />, path: '/admin' }] : []),
  ];

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f4f4f4',
          },
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" noWrap>
              OT-IT Integration
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">{username}</Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Toolbar /> {/* spacing below AppBar */}
        <Outlet /> {/* Render the routed page */}
      </Box>
    </Box>
  );
}

