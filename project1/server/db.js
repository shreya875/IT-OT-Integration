// server/db.js

const { MongoClient } = require("mongodb");
const { mongoUrl, dbName } = require("./config");

let db;

async function connectToMongo() {
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

function getDb() {
  return db;
}

module.exports = { connectToMongo, getDb };

