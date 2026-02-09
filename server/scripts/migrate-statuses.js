/*
Migration script to normalize order statuses to only: confirmed, delivered, cancelled
- Any order with status not in the allowed set will be set to 'confirmed'
- Status history entries with statuses in the legacy list will be normalized to 'confirmed'

Run: node scripts/migrate-statuses.js
Make sure MONGODB_URI is set in environment (server/.env or system env)
*/

const { connect, disconnect } = require('../lib/mongoClient');

const LEGACY_STATUSES_TO_CONFIRMED = ['processing', 'ready', 'out_for_delivery'];
const ALLOWED_STATUSES = ['confirmed', 'delivered', 'cancelled'];

async function migrate() {
  try {
    const db = await connect();
    console.log('Connected to DB. Starting migration...');

    const cursor = db.collection('orders').find({
      $or: [
        { status: { $nin: ALLOWED_STATUSES } },
        { 'statusHistory.status': { $in: LEGACY_STATUSES_TO_CONFIRMED } }
      ]
    });

    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const newStatus = ALLOWED_STATUSES.includes(doc.status) ? doc.status : 'confirmed';
      const newHistory = (doc.statusHistory || []).map((h) => {
        if (LEGACY_STATUSES_TO_CONFIRMED.includes(h.status)) {
          return Object.assign({}, h, { status: 'confirmed' });
        }
        return h;
      });

      await db.collection('orders').updateOne({ _id: doc._id }, { $set: { status: newStatus, statusHistory: newHistory } });
      count++;
    }

    console.log(`Migration finished. Updated ${count} orders.`);
    await disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try { await disconnect(); } catch (e) {}
    process.exit(1);
  }
}

migrate();
