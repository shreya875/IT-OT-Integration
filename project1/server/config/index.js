// config/index.js

const mqttBrokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";

const mesDbName = process.env.MES_DB_NAME || "ISA95_MES";
const erpDbName = process.env.ERP_DB_NAME || "ISA95_ERP";
const shopfloorDbNames = {
  shopfloor1: process.env.SF1_DB_NAME || "ISA95_SF1",
  shopfloor2: process.env.SF2_DB_NAME || "ISA95_SF2",
  shopfloor3: process.env.SF3_DB_NAME || "ISA95_SF3",
};

module.exports = {
  mqttBrokerUrl,

  mqttTopics: {
    order: "erp/production/order",
    heartbeat: "mes/shopfloors/heartbeat",
    report: "mes/final/report",
    instruction: {
      shopfloor1: "mes/shopfloor1/instruction",
      shopfloor2: "mes/shopfloor2/instruction",
      shopfloor3: "mes/shopfloor3/instruction",
    },
    reports: {
      shopfloor1: "shopfloor1/report",
      shopfloor2: "shopfloor2/report",
      shopfloor3: "shopfloor3/report",
    },
  },

  heartbeatInterval: 5000, // milliseconds - how often shopfloors send heartbeat
  heartbeatTimeout: 15000, // milliseconds - after this consider shopfloor down

  mongoUrl,
  dbName: process.env.LEGACY_DB_NAME || "ISA95_Factory", // legacy
  mesDbName,
  erpDbName,
  shopfloorDbNames,

  // JWT secret for auth
  jwtSecret: process.env.JWT_SECRET || "your-very-secure-secret",
};
