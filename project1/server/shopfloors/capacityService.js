// mes/capacityService.js

const { getMesDb } = require("../db/mongo");

// Get capacity for all shopfloors
async function getCapacities() {
  const db = getMesDb();
  const capacities = await db.collection("capacities").find({}).toArray();
  return capacities;
}

// Get numeric capacity for a specific shopfloor
async function getCapacity(shopfloor) {
  const db = getMesDb();
  const capDoc = await db.collection("capacities").findOne({ shopfloor });
  return capDoc?.capacity;
}

// Set or update capacity for a shopfloor
async function setCapacity(shopfloor, capacity) {
  const db = getMesDb();
  const result = await db.collection("capacities").updateOne(
    { shopfloor },
    { $set: { shopfloor, capacity: Number(capacity) } },
    { upsert: true }
  );
  return result;
}

// Check if a given target quantity can be accepted by the shopfloor
async function canAccept(shopfloor, targetQuantity) {
  const cap = await getCapacity(shopfloor);
  if (cap == null) return true; // if not set, accept by default
  return Number(targetQuantity) <= Number(cap);
}

module.exports = {
  getCapacities,
  getCapacity,
  setCapacity,
  canAccept,
};
