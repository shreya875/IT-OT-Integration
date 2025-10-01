// // src/pages/ReportsPage.js
// import React, { useEffect, useState } from 'react';
// import api from '../api';
// import { DataGrid } from '@mui/x-data-grid';

// function ReportsPage() {
// //   const [reports, setReports] = useState([]);

// useEffect(() => {
//    api.get('/reports').then(res => setReports(res.data));
//   }, []);

//   return (
//     <div>
//       <h2>Final Combined Reports</h2>
//       <table>
//         <thead>
//           <tr>
//             <th>Order ID</th>
//             <th>Produced</th>
//             <th>Defective</th>
//             <th>Equipment</th>
//           </tr>
//         </thead>

//         <tbody>
//             {reports.map((r, i) => (
//                 <tr key={i}>
//                     <td>{r.ProductionScheduleID ?? 'N/A'}</td>
//                     <td>{r.Quantity?.Produced ?? 'N/A'}</td>
//                     <td>{r.Quantity?.Defective ?? 'N/A'}</td>
//                     <td>{Array.isArray(r.EquipmentUsed) ? r.EquipmentUsed.join(', ') : 'N/A'}</td>
//                 </tr>
//   ))}
// </tbody>

//       </table>
//     </div>
//   );

// }

// export default ReportsPage;

// src/pages/ReportsPage.jsx

import React, { useEffect, useState } from 'react';
import api from '../api';
import { Tabs, Tab, Box as MBox } from '@mui/material';
import { Container, Typography, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [floorTab, setFloorTab] = useState(0);
  const [sfReports, setSfReports] = useState([]);
  const [erpOrders, setErpOrders] = useState([]);

  useEffect(() => {
    api.get('/api/reports/shopfloors').then(r => setSfReports(r.data)).catch(() => setSfReports([]));
    api.get('/api/reports/erp').then(r => setErpOrders(r.data)).catch(() => setErpOrders([]));
  }, []);

  // Lookup: Requested quantity by orderId from ERP orders
  const requestedByOrder = new Map(
    (Array.isArray(erpOrders) ? erpOrders : [])
      .map(r => ({
        orderId: r?.ProductionScheduleID,
        qty: typeof r?.Quantity === 'number' ? r.Quantity : (r?.Quantity?.Requested ?? undefined),
      }))
      .filter(r => r.orderId && typeof r.qty === 'number')
      .map(r => [r.orderId, Number(r.qty)])
  );


  const sfColumns = [
    { field: 'orderId', headerName: 'Order ID', width: 150 },
    { field: 'shopfloor', headerName: 'Shopfloor', width: 130 },
    { field: 'equipment', headerName: 'Equipment', width: 150 },
    { field: 'target', headerName: 'Target', width: 120 },
    { field: 'produced', headerName: 'Produced', width: 130 },
    { field: 'defective', headerName: 'Defective', width: 130 },
    { field: 'completed', headerName: 'Completed', width: 130 },
    { field: 'receivedAt', headerName: 'Received At', width: 200 },
  ];

  const sfRows = sfReports.map((r, index) => ({
    id: index,
    orderId: r.OrderID,
    shopfloor: r.shopfloor || '-',
    equipment: r.Equipment,
    target: Number(r.Target) || 0,
    produced: r.Produced,
    defective: r.Defective,
    completed: (Number(r.Produced) || 0) + (Number(r.Defective) || 0),
    receivedAt: r.receivedAt ? new Date(r.receivedAt).toLocaleString() : '-',
  }));

  const erpColumns = [
    { field: 'orderId', headerName: 'Order ID', width: 150 },
    { field: 'material', headerName: 'Material ID', width: 180 },
    { field: 'quantity', headerName: 'Quantity', width: 130 },
    { field: 'createdAt', headerName: 'Created At', width: 200 },
  ];

  const erpRows = erpOrders.map((r, index) => ({
    id: index,
    orderId: r.ProductionScheduleID,
    material: r?.Product?.MaterialID ?? '-',
    quantity: typeof r?.Quantity === 'number' ? r.Quantity : (r?.Quantity?.Requested ?? '-'),
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
  }));


  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        ERP
      </Typography>

      <MBox sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Shopfloors Raw" />
          <Tab label="ERP Orders" />
          <Tab label="Shopfloors (Per Floor)" />
        </Tabs>
      </MBox>

      {tab === 0 && (
        <Box sx={{ height: 500, width: '100%', mt: 2 }}>
          <DataGrid
            rows={sfRows}
            columns={sfColumns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ height: 500, width: '100%', mt: 2 }}>
          <DataGrid
            rows={erpRows}
            columns={erpColumns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ mt: 2 }}>
          {/* Inline per-floor tabs to avoid duplicate rendering */}
          <MBox sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={floorTab} onChange={(_, v) => setFloorTab(v)}>
              <Tab label="shopfloor1" />
              <Tab label="shopfloor2" />
              <Tab label="shopfloor3" />
            </Tabs>
          </MBox>
          {(() => {
            const currentFloor = ['shopfloor1','shopfloor2','shopfloor3'][floorTab];
            const floorRows = sfRows.filter(r => r.shopfloor === currentFloor);
            const sumTarget = floorRows.reduce((s, r) => s + (Number(r.target) || 0), 0);
            const sumProduced = floorRows.reduce((s, r) => s + (Number(r.produced) || 0), 0);
            const sumDefective = floorRows.reduce((s, r) => s + (Number(r.defective) || 0), 0);
            const sumCompleted = sumProduced + sumDefective;
            return (
              <>
                <Box sx={{ mb: 1, color: 'text.secondary' }}>
                  {`Summary (${currentFloor}): Target ${sumTarget} • Produced ${sumProduced} + Defective ${sumDefective} = Completed ${sumCompleted}`}
                </Box>
                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={floorRows}
                    columns={sfColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    localeText={{ noRowsLabel: 'No reports yet for this shopfloor.' }}
                  />
                </Box>
              </>
            );
          })()}
        </Box>
      )}
    </Container>
  );
}


