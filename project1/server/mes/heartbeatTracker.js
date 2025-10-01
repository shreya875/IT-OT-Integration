// // server/heartbeatTracker.js

// const { heartbeatTimeout } = require("./config");

// const lastHeartbeats = {
//   shopfloor1: null,
//   shopfloor2: null,
//   shopfloor3: null,
// };

// function updateHeartbeat(shopfloor) {
//   lastHeartbeats[shopfloor] = Date.now();
// }

// function getStatuses() {
//   const now = Date.now();
//   const statuses = {};
//   for (let floor in lastHeartbeats) {
//     statuses[floor] = now - lastHeartbeats[floor] < heartbeatTimeout ? "UP" : "DOWN";
//   }
//   return statuses;
// }

// module.exports = { updateHeartbeat, getStatuses };

// mes/heartbeatTracker.js
const { heartbeatTimeout } = require("../config");

const lastHeartbeats = {
  shopfloor1: null,
  shopfloor2: null,
  shopfloor3: null,
};

function updateHeartbeat(shopfloor) {
  lastHeartbeats[shopfloor] = Date.now();
}

function getStatuses() {
  const now = Date.now();
  const statuses = {};
  for (let floor in lastHeartbeats) {
    statuses[floor] = lastHeartbeats[floor] && now - lastHeartbeats[floor] < heartbeatTimeout ? "UP" : "DOWN";
  }
  return statuses;
}

module.exports = { updateHeartbeat, getStatuses };
