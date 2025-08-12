// db.js
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let _db;
async function connectDB() {
  if (_db) return _db;
  await client.connect();
  _db = client.db('fertilizerApp'); // DB name
  console.log('✅ Connected to MongoDB Atlas');
  return _db;
}

module.exports = connectDB;
