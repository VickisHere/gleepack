var express = require('express');
var router = express.Router();
const { connect } = require('../lib/mongoClient');
const jwt = require('jsonwebtoken');

const events = require('../lib/events');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization header' });
  const token = parts[1];
  try {
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
  if (req.user.role && (req.user.role === 'admin' || req.user.role === 'dba')) return next();
  return res.status(403).json({ error: 'Admin access required' });
}

function superAdminMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // only allow super admin
  if (req.user.role && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Super Admin access required' });
}

function deliveryMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // allow admin, dba, or delivery role
  if (req.user.role && (req.user.role === 'admin' || req.user.role === 'dba' || req.user.role === 'delivery')) return next();
  return res.status(403).json({ error: 'Delivery or Admin access required' });
}

// Create order (allow guest orders if no Authorization provided)
router.post('/', async (req, res, next) => {
  try {
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }

    const ObjectId = require('mongodb').ObjectId;
    // Try to read token if provided (optional)
    let userPayload = null;
    const auth = req.headers.authorization;
    if (auth) {
      const parts = auth.split(' ');
      if (parts.length === 2) {
        try {
          const jwt = require('jsonwebtoken');
          userPayload = jwt.verify(parts[1], JWT_SECRET);
        } catch (e) {
          // ignore invalid token, treat as guest
          userPayload = null;
        }
      }
    }

    let userSnapshot = { id: null, email: null, name: null };
    if (userPayload && userPayload.sub) {
      const userId = userPayload.sub;
      if (ObjectId.isValid(userId)) {
        const usr = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (usr) userSnapshot = { id: String(usr._id), email: usr.email, name: usr.name || null };
      } else {
        userSnapshot = { id: userId, email: userPayload.email || null, name: null };
      }
    }

    // Determine payment method and default payment status
      const incomingPaymentMethod = req.body.paymentMethod || (req.body.payment && req.body.payment.method) || null;
      const paymentMethod = incomingPaymentMethod ? String(incomingPaymentMethod).toLowerCase() : null;
      // treat common online methods as paid automatically, COD as unpaid
      const onlineMethods = ['online', 'upi', 'card', 'wallet', 'netbanking', 'razorpay', 'stripe'];
      const isOnline = paymentMethod && onlineMethods.some((m) => paymentMethod.includes(m));
      const defaultPaymentStatus = isOnline ? 'paid' : 'unpaid';
      const now = new Date();
      const paymentFields = {
        paymentMethod: incomingPaymentMethod || null,
        paymentStatus: defaultPaymentStatus,
        paymentUpdatedAt: now,
      };
      if (defaultPaymentStatus === 'paid') paymentFields.paidAt = now;

      const order = Object.assign({}, req.body, paymentFields, { userId: userSnapshot.id, userEmail: userSnapshot.email, userName: userSnapshot.name, createdAt: now, status: 'received', statusHistory: [{ status: 'received', by: userSnapshot.email || userSnapshot.id || 'guest', at: now }] });
    const result = await db.collection('orders').insertOne(order);
    const saved = await db.collection('orders').findOne({ _id: result.insertedId });

    // Save address to user profile if logged in
    if (userSnapshot.id && req.body.contact) {
      try {
        const userId = ObjectId.isValid(userSnapshot.id) ? new ObjectId(userSnapshot.id) : null;
        if (userId) {
          const address = {
            flatNo: req.body.contact.flatNo || '',
            area: req.body.contact.area || '',
            landmark: req.body.contact.landmark || '',
            addressType: req.body.contact.addressType || 'home',
            fullAddress: req.body.contact.address || '',
            savedAt: now
          };
          await db.collection('users').updateOne(
            { _id: userId },
            { $addToSet: { addresses: address } }
          );
        }
      } catch (e) {
        console.warn('Could not save address to user', e);
      }
    }

    // emit order created event for real-time listeners
    try {
      const events = require('../lib/events');
      events.emit('order_created', saved);
    } catch (e) {
      console.warn('Could not emit order_created', e && e.message);
    }
    return res.json(saved);
  } catch (err) {
    console.error('orders POST error:', err && err.stack ? err.stack : err);
    next(err);
  }
});

// Get orders for user
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }

    const orders = await db.collection('orders').find({ userId: req.user.sub }).toArray();
    return res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Admin: get all orders (with optional pagination)
router.get('/all', authMiddleware, deliveryMiddleware, async (req, res, next) => {
  try {
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }
    const q = {};
    const orders = await db.collection('orders').find(q).sort({ createdAt: -1 }).toArray();
    return res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Admin: update order status
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }
    const ObjectId = require('mongodb').ObjectId;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid order id' });
    const actor = req.user && (req.user.email || req.user.sub) || 'admin';
    const update = {
      $set: { status: status },
      $push: { statusHistory: { status: status, by: actor, at: new Date() } }
    };
    const result = await db.collection('orders').findOneAndUpdate({ _id: new ObjectId(id) }, update, { returnDocument: 'after' });
    if (!result.value) return res.status(404).json({ error: 'Order not found' });
    // emit update
    try { events.emit('order_updated', result.value); } catch (e) { console.warn('emit failed', e && e.message); }
    return res.json(result.value);
  } catch (err) {
    next(err);
  }
});

// Delivery: update order status and payment status (for COD)
router.patch('/:id/delivery-status', authMiddleware, deliveryMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }
    const ObjectId = require('mongodb').ObjectId;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid order id' });
    const actor = req.user && (req.user.email || req.user.sub) || 'delivery';
    
    const update = {
      $set: { status: status },
      $push: { statusHistory: { status: status, by: actor, at: new Date() } }
    };
    
    // If payment status is provided and it's a COD order, update payment status too
    if (paymentStatus && (paymentStatus === 'paid' || paymentStatus === 'unpaid')) {
      update.$set.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        update.$set.paidAt = new Date();
      }
    }
    
    const result = await db.collection('orders').findOneAndUpdate({ _id: new ObjectId(id) }, update, { returnDocument: 'after' });
    if (!result.value) return res.status(404).json({ error: 'Order not found' });
    // emit update
    try { events.emit('order_updated', result.value); } catch (e) { console.warn('emit failed', e && e.message); }
    return res.json(result.value);
  } catch (err) {
    next(err);
  }
});

// Admin: update payment status (paid/unpaid)
router.patch('/:id/payment', authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body; // expected 'paid' or 'unpaid'
    if (!paymentStatus) return res.status(400).json({ error: 'Missing paymentStatus' });
    if (!['paid','unpaid'].includes(paymentStatus)) return res.status(400).json({ error: 'Invalid paymentStatus' });
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }
    const ObjectId = require('mongodb').ObjectId;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid order id' });
    const actor = req.user && (req.user.email || req.user.sub) || 'admin';
    const now = new Date();
    const update = {
      $set: { paymentStatus: paymentStatus, paymentUpdatedAt: now },
      $push: { statusHistory: { status: `payment:${paymentStatus}`, by: actor, at: now } }
    };
    if (paymentStatus === 'paid') {
      update.$set.paidAt = now;
    } else {
      // mark unpaid: remove paidAt if present
      update.$unset = { paidAt: '' };
    }
    const result = await db.collection('orders').findOneAndUpdate({ _id: new ObjectId(id) }, update, { returnDocument: 'after' });
    if (!result.value) return res.status(404).json({ error: 'Order not found' });
    try { events.emit('order_updated', result.value); } catch (e) { console.warn('emit failed', e && e.message); }
    return res.json(result.value);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
