// // Native MongoDB-based user accessors (no Mongoose)
// const { getMesDb } = require("../../db/mongo");

// function usersCollection() {
//   return getMesDb().collection("users");
// }

// async function findOne(query) {
//   return usersCollection().findOne(query);
// }

// async function createUser({ username, passwordHash, role }) {
//   const now = new Date();
//   await usersCollection().createIndex({ username: 1 }, { unique: true });
//   const result = await usersCollection().insertOne({
//     username,
//     passwordHash,
//     role,
//     createdAt: now,
//     updatedAt: now,
//   });
//   return { _id: result.insertedId, username, role };
// }

// module.exports = { findOne, createUser };
// Native MongoDB-based user accessors (no Mongoose)
const { getMesDb } = require("../../db/mongo");

function usersCollection() {
  return getMesDb().collection("users");
}

async function findOne(query) {
  return usersCollection().findOne(query);
}

async function findById(id) {
  const { ObjectId } = require("mongodb");
  return usersCollection().findOne({ _id: new ObjectId(id) });
}

async function createUser({ username, passwordHash = null, role = "user", googleId = null }) {
  const now = new Date();
  await usersCollection().createIndex({ username: 1 }, { unique: true });

  const userDoc = {
    username,
    passwordHash, // null for Google accounts
    role,
    googleId,     // only set for Google users
    createdAt: now,
    updatedAt: now,
  };

  const result = await usersCollection().insertOne(userDoc);
  return { _id: result.insertedId, username, role, googleId };
}

async function findByGoogleId(googleId) {
  return usersCollection().findOne({ googleId });
}

module.exports = { findOne, findById, createUser, findByGoogleId };

