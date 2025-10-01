const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const { mongoUrl, dbName } = require("./config");

async function createUser(username, plainPassword, role = "user") {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db(dbName);

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await db.collection("users").insertOne({
      username,
      password: hashedPassword,
      role,
    });

    console.log(`User ${username} created.`);
  } finally {
    await client.close();
  }
}

// Example: create admin user
createUser("admin", "adminpassword", "admin");
