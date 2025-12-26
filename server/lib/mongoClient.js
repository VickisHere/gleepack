const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn('Warning: MONGODB_URI is not set in environment. Set it in server/.env');
}

let client = null;
let _db = null;
let isConnecting = false;
let connectionRetries = 0;
const maxRetries = 5;

async function connect() {
  if (_db && client) {
    try {
      // Ping to check if connection is still alive
      await client.db().admin().ping();
      return _db;
    } catch (err) {
      console.warn('MongoDB connection lost, reconnecting...');
      _db = null;
      client = null;
    }
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    let attempts = 0;
    while (isConnecting && attempts < 30) { // Wait up to 30 seconds
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    if (_db) return _db;
  }

  if (!uri) throw new Error('MONGODB_URI not configured');

  isConnecting = true;

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    });

    await client.connect();
    _db = client.db();
    connectionRetries = 0; // Reset retry count on successful connection
    console.log('✅ MongoDB connected successfully');
    return _db;
  } catch (err) {
    connectionRetries++;
    console.error(`❌ MongoDB connection failed (attempt ${connectionRetries}/${maxRetries}):`, err.message);

    if (connectionRetries < maxRetries) {
      console.log(`🔄 Retrying MongoDB connection in ${connectionRetries * 2} seconds...`);
      setTimeout(() => {
        isConnecting = false;
        connect(); // Recursive retry
      }, connectionRetries * 2000);
      throw new Error('MongoDB connection failed, retrying...');
    } else {
      console.error('💥 Max MongoDB connection retries reached');
      throw new Error('Failed to connect to MongoDB after multiple attempts');
    }
  } finally {
    isConnecting = false;
  }
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    _db = null;
    console.log('🔌 MongoDB disconnected');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, closing MongoDB connection...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, closing MongoDB connection...');
  await disconnect();
  process.exit(0);
});

module.exports = { connect, disconnect, getClient: () => client };
