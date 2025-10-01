// // src/pages/DistributePage.js
// import React, { useState } from 'react';
// import api from '../api';

// function DistributePage() {
//   const [orderId, setOrderId] = useState('');
//   const [materialId, setMaterialId] = useState('');
//   const [qty, setQty] = useState(10000);
//   const [dist, setDist] = useState({
//     shopfloor1: 0,
//     shopfloor2: 0,
//     shopfloor3: 0,
//   });

//   const handleSubmit = () => {
//     const order = {
//       ProductionScheduleID: orderId,
//       Product: { MaterialID: materialId },
//       Quantity: { Requested: parseInt(qty), Unit: "bottles" },
//     };

//     api.post('/distribute-load', {
//       order,
//       distribution: {
//         shopfloor1: parseInt(dist.shopfloor1),
//         shopfloor2: parseInt(dist.shopfloor2),
//         shopfloor3: parseInt(dist.shopfloor3),
//       }
//     }).then(() => {
//       alert("Order distributed!");
//     });
//   };

//   return (
//     <div>
//       <h2>Distribute Load</h2>
//       <input placeholder="Order ID" value={orderId} onChange={e => setOrderId(e.target.value)} />
//       <input placeholder="Material ID" value={materialId} onChange={e => setMaterialId(e.target.value)} />
//       <input placeholder="Total Qty" value={qty} onChange={e => setQty(e.target.value)} />

//       <h4>Distribute:</h4>
//       {["shopfloor1", "shopfloor2", "shopfloor3"].map(floor => (
//         <div key={floor}>
//           {floor}: <input
//             type="number"
//             value={dist[floor]}
//             onChange={e => setDist({ ...dist, [floor]: e.target.value })}
//           />
//         </div>
//       ))}

//       <button onClick={handleSubmit}>Distribute</button>
//     </div>
//   );
// }

// export default DistributePage;

// src/pages/DistributePage.jsx
import React, { useState } from 'react';
import {
  Container, TextField, Typography, Button, Grid, Paper
} from '@mui/material';
import api from '../api';

export default function DistributePage() {
  const [orderId, setOrderId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [qty, setQty] = useState(10000);
  const [dist, setDist] = useState({
    shopfloor1: 0,
    shopfloor2: 0,
    shopfloor3: 0,
  });

  const handleSubmit = () => {
    const order = {
      ProductionScheduleID: orderId,
      Product: { MaterialID: materialId },
      Quantity: { Requested: parseInt(qty), Unit: "bottles" },
    };

    api.post('/api/distribute-load', {
      order,
      distribution: {
        shopfloor1: parseInt(dist.shopfloor1),
        shopfloor2: parseInt(dist.shopfloor2),
        shopfloor3: parseInt(dist.shopfloor3),
      }
    }).then(() => {
      alert("✅ Order distributed successfully!");
    }).catch(err => {
      alert("❌ Distribution failed.");
      console.error(err);
    });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Distribute Load to Shopfloors
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Order ID"
              fullWidth
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Material ID"
              fullWidth
              value={materialId}
              onChange={e => setMaterialId(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Total Quantity"
              type="number"
              fullWidth
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1">Distribute Quantity:</Typography>
          </Grid>

          {["shopfloor1", "shopfloor2", "shopfloor3"].map(floor => (
            <Grid item xs={12} sm={4} key={floor}>
              <TextField
                label={floor}
                type="number"
                fullWidth
                value={dist[floor]}
                onChange={e => setDist({ ...dist, [floor]: e.target.value })}
              />
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              onClick={handleSubmit}
            >
              Submit Distribution
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

