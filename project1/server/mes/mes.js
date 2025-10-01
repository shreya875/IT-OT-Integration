// // server/mes.js

// const mqtt = require("mqtt");
// const express = require("express");
// const { connectToMongo, getDb } = require("../db");
// const { updateHeartbeat, getStatuses } = require("../heartbeatTracker");
// const { mqttBrokerUrl, mqttTopics } = require("../config");
// const { getCombinedReports } = require("./reportService");

// const client = mqtt.connect(mqttBrokerUrl);
// const app = express();
// app.use(express.json());

// const cors = require('cors');
// app.use(cors());

// const PORT = 3000;
// const pendingReports = {};

// // MQTT Setup
// client.on("connect", () => {
//   console.log("MES connected to MQTT");
//   client.subscribe([
//     mqttTopics.order,
//     ...Object.values(mqttTopics.reports),
//     mqttTopics.heartbeat,
//   ]);
// });

// client.on("message", async (topic, message) => {
//   const msg = JSON.parse(message.toString());

//   // Handle production order from ERP
//   if (topic === mqttTopics.order) {

//     if (topic === mqttTopics.order) {
//       console.log("\nMES received production order");
//       const order = msg;

//     }
//   }


//   // Handle shopfloor reports
//   if (Object.values(mqttTopics.reports).includes(topic)) {
//     const report = msg;
//     const orderId = report.OrderID;

//     if (!pendingReports[orderId]) pendingReports[orderId] = [];
//     pendingReports[orderId].push(report);

//     if (pendingReports[orderId].length === 3) {
//       const combined = {
//         ProductionScheduleID: orderId,
//         Status: "Completed",
//         Quantity: {
//           Produced: pendingReports[orderId].reduce((a, b) => a + b.Produced, 0),
//           Defective: pendingReports[orderId].reduce((a, b) => a + b.Defective, 0),
//           Unit: "bottles",
//         },
//         EquipmentUsed: pendingReports[orderId].map(r => r.Equipment),
//       };

//       console.log("\nMES final combined report:");
//       console.log(combined);
//       try {
//         await getDb().collection("reports").insertOne(combined);
//         console.log("Stored in Mongo DB");
//       } catch (err) {
//         console.error("Mongo insert error:", err);
//       }
//       client.publish(mqttTopics.report, JSON.stringify(combined));
//       delete pendingReports[orderId];
//     }
//   }

//   // Handle heartbeats
//   if (topic === mqttTopics.heartbeat) {
//     updateHeartbeat(msg.shopfloor);
//   }
// });

// // Express API
// app.get("/status", (req, res) => {
//   res.json(getStatuses());
// });

// app.get("/reports", async (req, res) => {
//   const data = await getCombinedReports();
//   res.json(data);
// });

// app.post("/distribute-load", (req, res) => {
//   const { order, distribution } = req.body;

//   for (let floor in distribution) {
//     const instruction = {
//       OrderID: order.ProductionScheduleID,
//       MaterialID: order.Product.MaterialID,
//       Target: distribution[floor],
//       Equipment: floor.toUpperCase(),
//     };
//     client.publish(mqttTopics.instruction[floor], JSON.stringify(instruction));
//   }

//   res.send({ message: "Load distributed." });
// });

// // Start Server
// (async () => {
//   await connectToMongo();
//   app.listen(PORT, () => console.log(`MES API running on http://localhost:${PORT}`));
// })();


// mes/mes.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const express = require("express");
const mqtt = require("mqtt");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const { connectToMongo, getMesDb, getShopfloorDb } = require("../db/mongo");
const { updateHeartbeat, getStatuses } = require("./heartbeatTracker");
const { getCombinedReports, addCommentToReport } = require("./reportService");
const { distributeLoad } = require("./loadDistributor");
const { mqttBrokerUrl, mqttTopics } = require("../config");
const { register, login, authMiddleware } = require("./auth");
const passport = require("passport");
const session = require("express-session");
const googleAuthRoutes = require("./googleAuth");

const client = mqtt.connect(mqttBrokerUrl);
const app = express();
const PORT = process.env.MES_PORT ? Number(process.env.MES_PORT) : 5001;

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.post("/api/register", register);
app.post("/api/login", login);
app.use("/auth", googleAuthRoutes);

// MQTT Setup
client.on("connect", () => {
  console.log("MES connected to MQTT broker");

  client.subscribe([
    mqttTopics.order,
    ...Object.values(mqttTopics.reports),
    mqttTopics.heartbeat,
  ]);
});

const pendingReports = {};

// Handle incoming MQTT messages
client.on("message", async (topic, message) => {
  const msg = JSON.parse(message.toString());

  if (topic === mqttTopics.order) {
    console.log("MES received production order", msg);
    // TODO: Handle order processing (store order if needed)
  }

  if (Object.values(mqttTopics.reports).includes(topic)) {
    let report = msg;
    // Sanitize quantities to avoid negatives or NaN
    const producedNum = Number(report.Produced);
    const defectiveNum = Number(report.Defective);
    const safeProduced = Math.max(0, Number.isFinite(producedNum) ? producedNum : 0);
    const safeDefective = Math.max(0, Number.isFinite(defectiveNum) ? defectiveNum : 0);
    report = { ...report, Produced: safeProduced, Defective: safeDefective };
    const orderId = report.OrderID;

    // Store raw shopfloor report
    try {
      const floorKey = Object.keys(mqttTopics.reports).find(k => mqttTopics.reports[k] === topic);
      await getMesDb().collection("shopfloor_reports").insertOne({
        ...report,
        topic,
        shopfloor: floorKey,
        receivedAt: new Date(),
      });
      // Decrease workload for the reporting shopfloor
      const completedQty = (Number(report.Produced) || 0) + (Number(report.Defective) || 0);
      if (floorKey && completedQty > 0) {
        await getMesDb().collection("workloads").updateOne(
          { shopfloor: floorKey },
          { $inc: { workload: -completedQty } },
          { upsert: true }
        );
      }
      // Mirror into the specific shopfloor DB
      if (floorKey) {
        await getShopfloorDb(floorKey).collection("reports").insertOne({
          ...report,
          receivedAt: new Date(),
        });
      }
    } catch (e) {
      console.error("Failed to store shopfloor report", e);
    }

    if (!pendingReports[orderId]) pendingReports[orderId] = [];
    pendingReports[orderId].push(report);

    if (pendingReports[orderId].length === 3) {
      const combined = {
        ProductionScheduleID: orderId,
        Status: "Completed",
        Quantity: {
          Produced: pendingReports[orderId].reduce((a, b) => a + b.Produced, 0),
          Defective: pendingReports[orderId].reduce((a, b) => a + b.Defective, 0),
          Unit: "bottles",
        },
        EquipmentUsed: pendingReports[orderId].map((r) => r.Equipment),
        comments: [],
        timestamp: Date.now(),
      };

      try {
        await getMesDb().collection("reports").insertOne(combined); // legacy
        await getMesDb().collection("mes_reports").insertOne(combined);
        console.log("Stored combined report in MongoDB (mes_reports)");
      } catch (err) {
        console.error("MongoDB insert error:", err);
      }

      client.publish(mqttTopics.report, JSON.stringify(combined));
      delete pendingReports[orderId];
    }
  }

  if (topic === mqttTopics.heartbeat) {
    updateHeartbeat(msg.shopfloor);
  }
});

// Protect routes after this middleware
app.use(authMiddleware);

app.get("/api/status", (req, res) => {
  res.json(getStatuses());
});

// Capacities endpoints
app.get("/api/capacities", async (req, res) => {
  const caps = await getMesDb().collection("capacities").find().toArray();
  res.json(caps);
});

// ===== Admin APIs =====
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const users = await getMesDb().collection('users').find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// List ERP orders; if ?username is provided, filter by creator
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { username } = req.query;
  const filter = username ? { createdBy: username } : {};
  try {
    const orders = await getMesDb().collection('erp_orders').find(filter).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

app.post("/api/capacities", async (req, res) => {
  const { shopfloor, capacity } = req.body;
  if (!shopfloor || typeof capacity !== 'number' || capacity < 0) return res.status(400).json({ error: "Invalid payload" });
  await getMesDb().collection("capacities").updateOne(
    { shopfloor },
    { $set: { shopfloor, capacity } },
    { upsert: true }
  );
  res.json({ message: "Capacity updated" });
});

// Workloads endpoints
app.get("/api/workloads", async (req, res) => {
  const w = await getMesDb().collection("workloads").find().toArray();
  res.json(w);
});

app.post("/api/workloads/reset", async (req, res) => {
  await getMesDb().collection("workloads").updateMany({}, { $set: { workload: 0 } });
  res.json({ message: "Workloads reset" });
});

app.get("/api/reports", async (req, res) => {
  const reports = await getCombinedReports();
  res.json(reports);
});

// Separate report collections
app.get("/api/reports/mes", async (req, res) => {
  const db = getMesDb();
  const isAdmin = req.user?.role === 'admin';
  if (isAdmin) {
    const data = await db.collection("mes_reports").find().sort({ timestamp: -1 }).toArray();
    return res.json(data);
  }
  // Limit to reports whose ProductionScheduleID belongs to this user's orders
  const orderIds = await db.collection("erp_orders").find({ createdBy: req.user.username }).project({ ProductionScheduleID: 1 }).toArray();
  const idSet = orderIds.map(o => o.ProductionScheduleID);
  const data = await db.collection("mes_reports").find({ ProductionScheduleID: { $in: idSet } }).sort({ timestamp: -1 }).toArray();
  res.json(data);
});

app.get("/api/reports/shopfloors", async (req, res) => {
  const db = getMesDb();
  const { shopfloor } = req.query;
  const base = shopfloor ? { shopfloor } : {};
  const isAdmin = req.user?.role === 'admin';
  if (isAdmin) {
    const data = await db.collection("shopfloor_reports").find(base).sort({ receivedAt: -1 }).toArray();
    return res.json(data);
  }
  const orderIds = await db.collection("erp_orders").find({ createdBy: req.user.username }).project({ ProductionScheduleID: 1 }).toArray();
  const idSet = orderIds.map(o => o.ProductionScheduleID);
  const filter = { ...base, OrderID: { $in: idSet } };
  const data = await db.collection("shopfloor_reports").find(filter).sort({ receivedAt: -1 }).toArray();
  res.json(data);
});

app.get("/api/reports/erp", async (req, res) => {
  const db = getMesDb();
  const isAdmin = req.user?.role === 'admin';
  const filter = isAdmin ? {} : { createdBy: req.user.username };
  const data = await db.collection("erp_orders").find(filter).sort({ createdAt: -1 }).toArray();
  res.json(data);
});

app.post("/api/reports/:id/comment", async (req, res) => {
  const { comment } = req.body;
  const reportId = req.params.id;
  try {
    await addCommentToReport(reportId, comment, req.user.username);
    res.json({ message: "Comment added" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.post("/api/distribute-load", async (req, res) => {
  const { order, distribution } = req.body;
  try {
    // Validate payload
    if (!order || !order.ProductionScheduleID || !order?.Product?.MaterialID) {
      return res.status(400).json({ error: "Invalid order payload" });
    }
    if (!distribution || typeof distribution !== 'object') {
      return res.status(400).json({ error: "Missing distribution" });
    }

    // Fetch capacities and current workloads
    const db = getMesDb();
    const capsArr = await db.collection("capacities").find().toArray();
    const workloadsArr = await db.collection("workloads").find().toArray();
    const capMap = Object.fromEntries(capsArr.map(c => [c.shopfloor, Number(c.capacity) || 0]));
    const wlMap = Object.fromEntries(workloadsArr.map(w => [w.shopfloor, Number(w.workload) || 0]));

    // Validate per-shopfloor requested amount does not exceed remaining capacity
    const floors = Object.keys(distribution);
    for (const sf of floors) {
      const reqQty = Number(distribution[sf]) || 0;
      if (reqQty < 0) {
        return res.status(400).json({ error: `Negative distribution for ${sf} is not allowed` });
      }
      const remaining = Math.max(0, (capMap[sf] ?? 0) - (wlMap[sf] ?? 0));
      if (reqQty > remaining) {
        return res.status(400).json({ error: `Distribution for ${sf} (${reqQty}) exceeds remaining capacity (${remaining})` });
      }
    }

    // Record ERP order with creator for scoping
    await db.collection("erp_orders").insertOne({
      ...order,
      distribution,
      createdBy: req.user?.username || 'unknown',
      createdAt: new Date(),
    });

    // Pass the manual distribution to distributeLoad
    await distributeLoad(client, order, distribution);
    res.json({ message: "Load distributed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to distribute load" });
  }
});

// Shopfloor performance comments
app.post("/api/shopfloors/:shopfloor/comment", async (req, res) => {
  const { shopfloor } = req.params;
  const { comment } = req.body;
  if (!comment || !shopfloor) return res.status(400).json({ error: "Missing comment or shopfloor" });
  try {
    await getMesDb().collection("shopfloor_comments").insertOne({
      shopfloor,
      comment,
      username: req.user?.username || "unknown",
      timestamp: new Date(),
    });
    res.json({ message: "Comment saved" });
  } catch (e) {
    res.status(500).json({ error: "Failed to save comment" });
  }
});

// Order-specific feedback for a shopfloor; displayed in /api/comments/shopfloors feed
app.post("/api/comments/shopfloors/order", async (req, res) => {
  const { shopfloor, orderId, comment } = req.body;
  if (!comment || !shopfloor || !orderId) return res.status(400).json({ error: "Missing shopfloor, orderId, or comment" });
  try {
    const doc = {
      reportId: null,
      orderId,
      shopfloor,
      comment,
      username: req.user?.username || "unknown",
      timestamp: new Date(),
    };
    await getMesDb().collection("shopfloor_report_comments").insertOne(doc);
    res.json({ message: "Order feedback saved" });
  } catch (e) {
    res.status(500).json({ error: "Failed to save order feedback" });
  }
});

app.get("/api/shopfloors/:shopfloor/comments", async (req, res) => {
  const { shopfloor } = req.params;
  try {
    const items = await getMesDb()
      .collection("shopfloor_comments")
      .find({ shopfloor, username: req.user?.username || "unknown" })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: "Failed to retrieve comments" });
  }
});

// Per-report comments on shopfloor reports
app.post("/api/reports/shopfloors/:id/comment", async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: "Missing comment" });
  try {
    const _id = new ObjectId(id);
    const report = await getMesDb().collection("shopfloor_reports").findOne({ _id });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const doc = {
      reportId: _id,
      orderId: report.OrderID,
      shopfloor: report.shopfloor,
      comment,
      username: req.user?.username || "unknown",
      timestamp: new Date(),
    };
    await getMesDb().collection("shopfloor_report_comments").insertOne(doc);
    res.json({ message: "Comment added" });
  } catch (e) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Query per-report comments (optionally filtered by shopfloor)
app.get("/api/comments/shopfloors", async (req, res) => {
  const { shopfloor } = req.query;
  const isAdmin = req.user?.role === 'admin';
  const base = shopfloor ? { shopfloor } : {};
  const filter = isAdmin ? base : { ...base, username: req.user?.username || "unknown" };
  try {
    const items = await getMesDb()
      .collection("shopfloor_report_comments")
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: "Failed to retrieve comments" });
  }
});

// Start the MES server
(async () => {
  await connectToMongo();
  // Seed hardcoded capacities if missing in MES DB
  const db = getMesDb();
  const count = await db.collection("capacities").countDocuments();
  if (count === 0) {
    await db.collection("capacities").insertMany([
      { shopfloor: "shopfloor1", capacity: 4000 },
      { shopfloor: "shopfloor2", capacity: 3000 },
      { shopfloor: "shopfloor3", capacity: 3000 },
    ]);
    console.log("Seeded shopfloor capacities");
  }
  app.listen(PORT, () => console.log(`MES API running on http://localhost:${PORT}`));
})();
