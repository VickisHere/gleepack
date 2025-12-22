const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn('Warning: MONGODB_URI is not set in environment. Set it in server/.env');
}

let client = null;
let _db = null;

async function connect() {
  if (_db) return _db;
  if (!uri) throw new Error('MONGODB_URI not configured');
  if (!client) {
    client = new MongoClient(uri);
  }
  await client.connect();
  _db = client.db();
  return _db;
}

module.exports = { connect, getClient: () => client };
