const express = require('express');
const router = express.Router();
const { connect } = require('../lib/mongoClient');
const events = require('../lib/events');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';

function requireAdmin(req, res) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const parts = auth.split(' ');
  if (parts.length !== 2) return false;
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload && payload.role === 'admin') return true;
    return false;
  } catch (e) {
    return false;
  }
}

function requireInventoryManager(req, res) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const parts = auth.split(' ');
  if (parts.length !== 2) return false;
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload && (payload.role === 'admin' || payload.role === 'gim')) return true;
    return false;
  } catch (e) {
    return false;
  }
}

// Public: list products
router.get('/', async (req, res) => {
  try {
    const db = await connect();
    const products = await db.collection('products').find({}).toArray();
    return res.json(products);
  } catch (err) {
    console.error('products list error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Could not fetch products' });
  }
});

// Public: get product by id
router.get('/:id', async (req, res) => {
  try {
    const db = await connect();
    const id = req.params.id;
    let p;
    // try by string id
    try {
      p = await db.collection('products').findOne({ id: id });
    } catch (e) {
      p = null;
    }
    if (!p) {
      // try by number id
      try {
        p = await db.collection('products').findOne({ id: Number(id) });
      } catch (e) {
        p = null;
      }
    }
    if (!p) {
      // try by _id
      try {
        p = await db.collection('products').findOne({ _id: new ObjectId(id) });
      } catch (e) {
        p = null;
      }
    }
    if (!p) return res.status(404).json({ error: 'Not found' });
    return res.json(p);
  } catch (err) {
    console.error('products get error', err);
    return res.status(500).json({ error: 'Could not fetch product' });
  }
});

// Admin/GIM: create product
router.post('/', async (req, res) => {
  try {
    if (!requireInventoryManager(req, res)) return res.status(403).json({ error: 'Inventory Manager access required' });
    const body = req.body || {};
    const db = await connect();
    // ensure id exists
    const id = body.id || String(Date.now());
    const doc = Object.assign({}, body, { id });
    await db.collection('products').insertOne(doc);
    try { events.emit('product_created', doc); } catch (e) { console.warn('emit product_created failed'); }
    return res.status(201).json(doc);
  } catch (err) {
    console.error('products create error', err);
    return res.status(500).json({ error: 'Could not create product' });
  }
});

// Admin/GIM: update product
router.patch('/:id', async (req, res) => {
  try {
    if (!requireInventoryManager(req, res)) return res.status(403).json({ error: 'Inventory Manager access required' });
    const db = await connect();
    const id = req.params.id;
    const update = { $set: req.body || {} };
    let result;
    // try by string id
    try {
      result = await db.collection('products').findOneAndUpdate({ id: id }, update, { returnOriginal: false });
    } catch (e) {
      result = null;
    }
    if (!result || !result.value) {
      // try by number id
      try {
        result = await db.collection('products').findOneAndUpdate({ id: Number(id) }, update, { returnOriginal: false });
      } catch (e) {
        result = null;
      }
    }
    if (!result || !result.value) {
      // try by _id
      try {
        result = await db.collection('products').findOneAndUpdate({ _id: new ObjectId(id) }, update, { returnOriginal: false });
      } catch (e) {
        result = null;
      }
    }
    if (!result || !result.value) return res.status(404).json({ error: 'Not found' });
    try { events.emit('product_updated', result.value); } catch (e) { console.warn('emit product_updated failed'); }
    return res.json(result.value);
  } catch (err) {
    console.error('products update error', err);
    return res.status(500).json({ error: 'Could not update product' });
  }
});

// Admin/GIM: delete product
router.delete('/:id', async (req, res) => {
  try {
    if (!requireInventoryManager(req, res)) return res.status(403).json({ error: 'Inventory Manager access required' });
    const db = await connect();
    const id = req.params.id;
    let result;
    // try by string id
    try {
      result = await db.collection('products').deleteOne({ id: id });
    } catch (e) {
      result = { deletedCount: 0 };
    }
    if (result.deletedCount === 0) {
      // try by number id
      try {
        result = await db.collection('products').deleteOne({ id: Number(id) });
      } catch (e) {
        result = { deletedCount: 0 };
      }
    }
    if (result.deletedCount === 0) {
      // try by _id
      try {
        result = await db.collection('products').deleteOne({ _id: new ObjectId(id) });
      } catch (e) {
        result = { deletedCount: 0 };
      }
    }
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    try { events.emit('product_deleted', id); } catch (e) { console.warn('emit product_deleted failed'); }
    return res.json({ ok: true });
  } catch (err) {
    console.error('products delete error', err);
    return res.status(500).json({ error: 'Could not delete product' });
  }
});

// Admin/GIM: upload image for product (accepts JSON { filename, data }) where data is a data URL
// Vercel-compatible: stores as data URL in database instead of writing files
router.post('/:id/image', async (req, res) => {
  try {
    if (!requireInventoryManager(req, res)) return res.status(403).json({ error: 'Inventory Manager access required' });
    const id = req.params.id;
    const body = req.body || {};
    const { filename, data } = body;
    if (!filename || !data) return res.status(400).json({ error: 'filename and data required' });

    // data is expected as data:image/<ext>;base64,AAAA
    const match = String(data).match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/);
    let dataUrl;
    if (match) {
      dataUrl = data; // Already a data URL
    } else {
      // fallback: try raw base64, assume PNG
      try {
        const buffer = Buffer.from(data, 'base64');
        dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
    }

    // update product record with data URL
    const db = await connect();
    await db.collection('products').updateOne({ id }, { $set: { image: dataUrl } });
    try { events.emit('product_updated', { id, image: dataUrl }); } catch (e) { /* ignore */ }
    return res.json({ ok: true, url: dataUrl });
  } catch (err) {
    console.error('product image upload error', err);
    return res.status(500).json({ error: 'Could not upload image' });
  }
});

module.exports = router;
