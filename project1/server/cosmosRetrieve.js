// cosmosRetrieve.js
const { CosmosClient } = require("@azure/cosmos");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
const cosmosKey = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DB;
const containerId = process.env.COSMOS_CONTAINER;

if (!cosmosEndpoint || !cosmosKey || !databaseId || !containerId) {
  console.warn(
    "Cosmos env vars missing. Please set COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DB, COSMOS_CONTAINER in project1/server/.env"
  );
}

const cosmosClient = new CosmosClient({
  endpoint: cosmosEndpoint,
  key: cosmosKey,
});

const database = cosmosClient.database(databaseId);
const container = database.container(containerId);

async function readItems() {
  try {
    const query = "SELECT * FROM c ORDER BY c.timestamp DESC";
    const { resources: items } = await container.items.query(query).fetchAll();

    console.log("Documents from Cosmos DB:");
    items.forEach((item, i) => {
      console.log(`${i + 1}. ${item.deviceId} at ${item.timestamp}`);
      console.log("   Data:", JSON.stringify(item.data));
    });

    return items;
  } catch (err) {
    console.error("Error reading from Cosmos:", err);
    return [];
  }
}

// Run if called directly
if (require.main === module) {
  readItems();
}

module.exports = { readItems };
