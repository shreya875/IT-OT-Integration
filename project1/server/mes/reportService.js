// // server/reportService.js

// const { getDb } = require("../db");

// async function getMongoReports() {
//   const db = getDb();
//   return await db.collection("reports").find().toArray();
// }

// // CosmosDB stub
// async function getCosmosReports() {
//   return []; // Assume no CosmosDB data for now
// }

// async function getCombinedReports() {
//   const mongoData = await getMongoReports();
//   const cosmosData = await getCosmosReports();
//   return [...mongoData, ...cosmosData];
// }

// module.exports = { getCombinedReports };

// mes/reportService.js
const { getMesDb } = require("../db/mongo");

async function getCombinedReports() {
  const db = getMesDb();
  return await db.collection("reports").find().toArray();
}

async function addCommentToReport(reportId, comment, username) {
  const db = getMesDb();
  await db.collection("reports").updateOne(
    { ProductionScheduleID: reportId },
    { $push: { comments: { username, comment, timestamp: new Date() } } }
  );
}

module.exports = { getCombinedReports, addCommentToReport };
