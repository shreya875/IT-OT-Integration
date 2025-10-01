// cosmosSave.js
const { EventHubConsumerClient } = require("@azure/event-hubs");
const { CosmosClient } = require("@azure/cosmos");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Environment variables
const eventHubConnectionString = process.env.EVENTHUB_CONNECTION_STRING;
const consumerGroup = process.env.EVENTHUB_CONSUMER_GROUP || "$Default";

const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
const cosmosKey = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DB;
const containerId = process.env.COSMOS_CONTAINER;

if (!eventHubConnectionString) {
  console.warn("EVENTHUB_CONNECTION_STRING not set in project1/server/.env");
}
if (!cosmosEndpoint || !cosmosKey || !databaseId || !containerId) {
  console.warn("Cosmos env vars missing. Set COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DB, COSMOS_CONTAINER in project1/server/.env");
}

const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
const database = cosmosClient.database(databaseId);
const container = database.container(containerId);

async function saveToCosmos(eventData) {
  try {
    const item = {
      id: `${Date.now()}-${Math.random()}`,
      deviceId: eventData.systemProperties?.["iothub-connection-device-id"] || "unknown",
      timestamp: new Date().toISOString(),
      data: eventData.body
    };
    await container.items.create(item);
    console.log("Saved to Cosmos:", item);
  } catch (err) {
    console.error("Error saving to Cosmos:", err);
  }
}

async function main() {
  const consumerClient = new EventHubConsumerClient(consumerGroup, eventHubConnectionString);
  console.log("Listening for events from IoT Hub...");

  consumerClient.subscribe({
    processEvents: async (events) => {
      for (const event of events) {
        console.log("Event received:", event.body);
        await saveToCosmos(event);
      }
    },
    processError: async (err) => {
      console.error("Error in subscription:", err);
    }
  });

  process.stdin.resume(); // Keeps the process alive
}

main().catch(console.error);
