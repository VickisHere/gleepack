var express = require('express');
var router = express.Router();
const { connect } = require('../lib/mongoClient');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization header' });
  const token = parts[1];
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // allow admin or dba role for admin operations
  if (req.user.role && (req.user.role.toLowerCase() === 'admin' || req.user.role.toLowerCase() === 'dba')) return next();
  return res.status(403).json({ error: 'Admin access required' });
}

// Add waiting customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, whatsappNumber, district, address, items } = req.body;
    
    if (!whatsappNumber || !district) {
      return res.status(400).json({ error: 'WhatsApp number and district are required' });
    }

    const db = await connect();
    const waitingCustomer = {
      name: name || 'Anonymous',
      phone: phone || '',
      whatsappNumber,
      district,
      address: address || '',
      items: items || [],
      createdAt: new Date()
    };

    const result = await db.collection('waiting_customers').insertOne(waitingCustomer);
    return res.status(201).json({ id: result.insertedId, ...waitingCustomer });
  } catch (err) {
    console.error('Error adding waiting customer:', err);
    return res.status(500).json({ error: 'Failed to add waiting customer' });
  }
});

// Get all waiting customers (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const waitingCustomers = await db.collection('waiting_customers').find({}).sort({ createdAt: -1 }).toArray();
    return res.json(waitingCustomers);
  } catch (err) {
    console.error('Error fetching waiting customers:', err);
    return res.status(500).json({ error: 'Failed to fetch waiting customers' });
  }
});

// Delete waiting customer (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const result = await db.collection('waiting_customers').deleteOne({ _id: require('mongodb').ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Waiting customer not found' });
    }
    return res.json({ message: 'Waiting customer deleted' });
  } catch (err) {
    console.error('Error deleting waiting customer:', err);
    return res.status(500).json({ error: 'Failed to delete waiting customer' });
  }
});

module.exports = router;