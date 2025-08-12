// db.js
const { MongoClient } = require("mongodb");

const uri = "YOUR_MONGODB_CONNECTION_STRING"; // From MongoDB Atlas
let client;
let db;

async function connectDB() {
  if (db) return db; // reuse existing connection

  client = new MongoClient(uri);
  await client.connect();
  db = client.db("mydatabase"); // Replace with your database name

  console.log("✅ Connected to MongoDB");
  return db;
}

module.exports = connectDB;
