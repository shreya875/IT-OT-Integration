// server/shopfloor1.js

const mqtt = require("mqtt");
const { mqttBrokerUrl, mqttTopics, heartbeatInterval } = require("../config");
const { canAccept } = require("./capacityService");

const SHOPFLOOR = "shopfloor3";
const client = mqtt.connect(mqttBrokerUrl);

client.on("connect", () => {
  console.log(`${SHOPFLOOR} connected to MQTT`);
  client.subscribe(mqttTopics.instruction[SHOPFLOOR]);

  setInterval(() => {
    const heartbeat = {
      shopfloor: SHOPFLOOR,
      timestamp: Date.now(),
    };
    client.publish(mqttTopics.heartbeat, JSON.stringify(heartbeat));
  }, heartbeatInterval);
});

client.on("message", async (topic, message) => {
  const instruction = JSON.parse(message.toString());
  console.log(` ${SHOPFLOOR} received instruction:`, instruction);

  try {
    const ok = await canAccept(SHOPFLOOR, instruction.Target);
    if (!ok) {
      const rejectReport = {
        OrderID: instruction.OrderID,
        Equipment: instruction.Equipment,
        Produced: 0,
        Defective: 0,
        Rejected: true,
        Reason: "Target exceeds capacity",
      };
      console.log(`${SHOPFLOOR} rejecting instruction due to capacity limit`);
      client.publish(mqttTopics.reports[SHOPFLOOR], JSON.stringify(rejectReport));
      return;
    }
  } catch (e) {
    console.error(`${SHOPFLOOR} capacity check failed`, e);
  }

  const targetQty = Math.max(0, Number(instruction.Target) || 0);
  const randomDefective = Math.floor(Math.random() * 100);
  const defective = Math.min(randomDefective, targetQty);
  const produced = Math.max(0, targetQty - defective);
  const report = {
    OrderID: instruction.OrderID,
    Equipment: instruction.Equipment,
    Target: targetQty,
    Produced: produced,
    Defective: defective,
  };

  console.log(`${SHOPFLOOR} reporting to MES`);
  client.publish(mqttTopics.reports[SHOPFLOOR], JSON.stringify(report));
});
