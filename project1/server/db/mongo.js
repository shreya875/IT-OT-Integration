// db/mongo.js
const { MongoClient } = require("mongodb");
const { mongoUrl, mesDbName, erpDbName, shopfloorDbNames } = require("../config");

let mesDb;
let erpDb;
const shopfloorDbs = {};

async function connectToMongo() {
  if (mesDb && erpDb && Object.keys(shopfloorDbs).length === 3) {
    return { mesDb, erpDb, shopfloorDbs };
  }

  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    console.log("Connected to MongoDB");
    mesDb = client.db(mesDbName);
    erpDb = client.db(erpDbName);
    shopfloorDbs.shopfloor1 = client.db(shopfloorDbNames.shopfloor1);
    shopfloorDbs.shopfloor2 = client.db(shopfloorDbNames.shopfloor2);
    shopfloorDbs.shopfloor3 = client.db(shopfloorDbNames.shopfloor3);
    return { mesDb, erpDb, shopfloorDbs };
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

function getMesDb() {
  if (!mesDb) throw new Error("MongoDB (MES) not connected yet");
  return mesDb;
}

function getErpDb() {
  if (!erpDb) throw new Error("MongoDB (ERP) not connected yet");
  return erpDb;
}

function getShopfloorDb(shopfloor) {
  if (!shopfloorDbs[shopfloor]) throw new Error(`MongoDB (${shopfloor}) not connected yet`);
  return shopfloorDbs[shopfloor];
}

module.exports = { connectToMongo, getMesDb, getErpDb, getShopfloorDb };
