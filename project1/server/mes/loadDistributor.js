// mes/loadDistributor.js
const { getMesDb } = require("../db/mongo");
const { mqttTopics } = require("../config");

// Example capacity schema:
// { shopfloor: "shopfloor1", capacity: 4000 }

async function distributeLoad(mqttClient, order, manualDistribution = null) {
  const db = getMesDb();
  let distribution;

  // If manual distribution is provided, use it directly
  if (manualDistribution && typeof manualDistribution === 'object') {
    distribution = manualDistribution;
    console.log("Using manual distribution:", distribution);
  } else {
    // Otherwise, use automatic distribution algorithm
    const capacities = await db.collection("capacities").find().toArray();
    const workloadsArr = await db.collection("workloads").find().toArray();
    const currentWorkloadByFloor = workloadsArr.reduce((acc, w) => {
      acc[w.shopfloor] = w.workload || 0;
      return acc;
    }, {});

    const totalCapacity = capacities.reduce((sum, c) => sum + c.capacity, 0);
    if (totalCapacity === 0) throw new Error("Total capacity is zero");

    // Support order.Quantity as number or object { Requested } from UI
    const requested = typeof order.Quantity === 'number'
      ? order.Quantity
      : (order?.Quantity?.Requested || order?.Quantity?.Total || 0);

    if (!requested || requested <= 0) {
      throw new Error("Invalid order quantity");
    }

    // Workload-aware even-finish distribution:
    // Solve for T: sum(max(0, cap_i*T - B_i)) = requested
    const caps = capacities.map(c => ({ shopfloor: c.shopfloor, cap: c.capacity, B: currentWorkloadByFloor[c.shopfloor] || 0 }));
    const sumCap = caps.reduce((s, x) => s + x.cap, 0);
    const sumB = caps.reduce((s, x) => s + x.B, 0);
    let T = (requested + sumB) / sumCap;
    let shares = caps.map(x => ({ shopfloor: x.shopfloor, share: Math.max(0, x.cap * T - x.B) }));

    // Floor to integers and distribute remaining units by largest fractional parts
    const floored = shares.map(s => ({ ...s, qty: Math.floor(s.share), frac: s.share - Math.floor(s.share) }));
    let assigned = floored.reduce((sum, s) => sum + s.qty, 0);
    let remaining = requested - assigned;
    floored.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < floored.length && remaining > 0; i++) {
      floored[i].qty += 1;
      remaining -= 1;
    }

    distribution = {};
    for (const s of floored) {
      distribution[s.shopfloor] = s.qty;
    }
    console.log("Using automatic distribution:", distribution);
  }

  // Send instructions to shopfloors
  for (let floor in distribution) {
    const targetQty = Number(distribution[floor]) || 0;
    if (targetQty > 0) {
      const instruction = {
        OrderID: order.ProductionScheduleID,
        MaterialID: order.Product.MaterialID,
        Target: targetQty,
        Equipment: floor.toUpperCase(),
      };
      console.log(`Sending instruction to ${floor}:`, instruction);
      mqttClient.publish(mqttTopics.instruction[floor], JSON.stringify(instruction));
    }
  }

  // Update workloads: add assigned quantities
  for (const floor in distribution) {
    const qty = Number(distribution[floor]) || 0;
    if (qty > 0) {
      await db.collection("workloads").updateOne(
        { shopfloor: floor },
        { $inc: { workload: qty } },
        { upsert: true }
      );
    }
  }
  
  return distribution;
}

module.exports = { distributeLoad };
