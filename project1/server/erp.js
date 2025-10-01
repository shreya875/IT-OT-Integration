// server/erp.js

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");
const cors = require("cors");
const { mqttBrokerUrl, mqttTopics } = require("./config");
const { connectToMongo, getErpDb, getMesDb } = require("./db/mongo");

const app = express();
const PORT = process.env.ERP_PORT ? Number(process.env.ERP_PORT) : 4001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MQTT Client
const mqttClient = mqtt.connect(mqttBrokerUrl);

mqttClient.on("connect", () => {
  console.log("ERP connected to MQTT broker");
  // Ensure we can publish by subscribing to order ack/report if needed
});

// API endpoint to receive production order from UI
app.post("/api/send-order", async (req, res) => {
  const productionOrder = req.body;

  if (!productionOrder?.ProductionScheduleID || !productionOrder?.Quantity) {
    return res.status(400).json({ error: "Invalid order format" });
  }

  console.log("Received production order from UI:", productionOrder);

  // Persist ERP order
  try {
    await connectToMongo();
    await getErpDb().collection("orders").insertOne({
      ...productionOrder,
      createdAt: new Date(),
    });
    // Mirror into MES for unified viewing
    await getMesDb().collection("erp_orders").insertOne({
      ...productionOrder,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("Failed to store ERP order", e);
  }

  mqttClient.publish(mqttTopics.order, JSON.stringify(productionOrder), (err) => {
    if (err) {
      console.error("Failed to publish to MQTT:", err);
      return res.status(500).json({ error: "Failed to publish order" });
    }

    console.log("Published production order to MES via MQTT");
    res.status(200).json({ message: "Order sent to MES" });
  });
});

app.listen(PORT, () => {
  console.log(`ERP HTTP server running at http://localhost:${PORT}`);
});
