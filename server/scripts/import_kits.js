const path = require('path');
const fs = require('fs');
const { connect, getClient } = require('../lib/mongoClient');

async function run() {
  try {
    const file = path.join(__dirname, '..', 'data', 'kits.json');
    const raw = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(raw);
    const kits = json.kits || [];
    const addons = json.addons || [];

    const db = await connect();

    // ensure index on products.id
    await db.collection('products').createIndex({ id: 1 }, { unique: true });

    let inserted = 0;
    for (const k of kits) {
      const doc = Object.assign({}, k);
      try {
        await db.collection('products').updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
        inserted++;
      } catch (e) {
        console.warn('Could not upsert product', doc.id, e && e.message);
      }
    }

    // write addons into addons collection
    if (addons.length > 0) {
      await db.collection('addons').createIndex({ id: 1 }, { unique: true });
      for (const a of addons) {
        try {
          await db.collection('addons').updateOne({ id: a.id }, { $set: a }, { upsert: true });
        } catch (e) {
          console.warn('Could not upsert addon', a.id, e && e.message);
        }
      }
    }

    console.log(`Imported ${inserted} products and ${addons.length} addons`);
    if (getClient()) await getClient().close();
    process.exit(0);
  } catch (err) {
    console.error('Import failed', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
