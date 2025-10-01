// cosmosApi.js
const express = require("express");
const cors = require("cors");
const { readItems } = require("./cosmosRetrieve");

const app = express();
const PORT = 5000;

app.use(cors());

app.get("/api/cosmos-data", async (req, res) => {
  try {
    const items = await readItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve data from Cosmos DB" });
  }
});

app.listen(PORT, () => {
  console.log(`Cosmos API server running at http://localhost:${PORT}`);
});
