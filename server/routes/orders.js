var express = require('express');
var router = express.Router();
const { connect } = require('../lib/mongoClient');
const jwt = require('jsonwebtoken');

const events = require('../lib/events');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    console.warn('authMiddleware: Missing Authorization header', { path: req.path, method: req.method });
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const parts = auth.split(' ');
  if (parts.length !== 2) {
    console.warn('authMiddleware: Invalid Authorization header format', { header: auth });
    return res.status(401).json({ error: 'Invalid authorization header' });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.warn('authMiddleware: Token verification failed', { message: err && err.message, path: req.path });
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

// Create order (authentication required)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }

    const ObjectId = require('mongodb').ObjectId;
    
    // User is authenticated from authMiddleware
    const userId = req.user.sub;
    let userSnapshot = { id: userId, email: req.user.email, name: req.user.name || null };
    
    // Get full user details from database
    if (ObjectId.isValid(userId)) {
      const usr = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (usr) userSnapshot = { id: String(usr._id), email: usr.email, name: usr.name || null };
    }

    // Handle coupon validation and application
    let couponData = null;
    let discountAmount = 0;
    let commissionAmount = 0;
    let influencerId = null;

    if (req.body.couponCode && userSnapshot.id) {
      try {
        const couponCode = req.body.couponCode.toUpperCase();
        const orderValue = req.body.totalAmount || 0;

        // Find coupon
        const coupon = await db.collection('coupons').findOne({ code: couponCode });
        if (!coupon) {
          return res.status(400).json({ error: 'Invalid coupon code' });
        }

        // Check if active
        if (!coupon.isActive) {
          return res.status(400).json({ error: 'Coupon is inactive' });
        }

        // Check dates
        const now = new Date();
        if (now < coupon.startDate || now > coupon.expiryDate) {
          return res.status(400).json({ error: 'Coupon is expired or not yet valid' });
        }

        // Check total usage
        if (coupon.totalUsageLimit && coupon.usageCount >= coupon.totalUsageLimit) {
          return res.status(400).json({ error: 'Coupon usage limit exceeded' });
        }

        // Check min order value
        if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
          return res.status(400).json({ error: 'Order value does not meet minimum requirement' });
        }

        // Check user assignment for user-specific coupons
        if (coupon.couponType === 'user-specific') {
          const assigned = await db.collection('user_coupons').findOne({
            couponId: coupon._id,
            userId: new ObjectId(userSnapshot.id)
          });
          if (!assigned) {
            return res.status(403).json({ error: 'You are not eligible for this coupon' });
          }

          // Check per user limit
          if (assigned.usageCount >= coupon.perUserLimit) {
            return res.status(400).json({ error: 'You have exceeded the usage limit for this coupon' });
          }
        }

        // Calculate discount
        const value = coupon.value;
        if (coupon.type === 'flat') {
          discountAmount = value;
        } else if (coupon.type === 'percentage') {
          discountAmount = (orderValue * value) / 100;
        }

        // Apply max discount
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }

        // Ensure discount doesn't exceed order value
        if (discountAmount > orderValue) {
          discountAmount = orderValue;
        }

        // Calculate commission for influencer coupons
        if (coupon.isInfluencerCoupon && coupon.influencerId && coupon.commissionPercentage) {
          commissionAmount = (discountAmount * coupon.commissionPercentage) / 100;
          influencerId = coupon.influencerId;
        }

        couponData = {
          _id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: value,
          couponType: coupon.couponType,
          discountAmount: discountAmount,
          commissionAmount: commissionAmount,
          influencerId: influencerId
        };

      } catch (couponError) {
        console.error('Coupon validation error:', couponError);
        return res.status(400).json({ error: 'Invalid coupon' });
      }
    }

    // Determine payment method and default payment status
      const incomingPaymentMethod = req.body.paymentMethod || (req.body.payment && req.body.payment.method) || req.body.payment || null;
      let paymentMethod = incomingPaymentMethod ? String(incomingPaymentMethod).toLowerCase() : null;
      
      // treat common online methods as paid automatically, COD as unpaid
      const onlineMethods = ['online', 'upi', 'card', 'wallet', 'netbanking', 'razorpay', 'stripe'];
      const isOnline = paymentMethod && onlineMethods.some((m) => paymentMethod.includes(m));
      const defaultPaymentStatus = isOnline ? 'paid' : 'unpaid';
      
      // Normalize payment method names for display
      if (paymentMethod === 'cod') {
        paymentMethod = 'COD';
      } else {
        paymentMethod = 'Online';
      }
      const now = new Date();
      const paymentFields = {
        paymentMethod: paymentMethod,
        paymentStatus: defaultPaymentStatus,
        paymentUpdatedAt: now,
      };
      if (defaultPaymentStatus === 'paid') paymentFields.paidAt = now;

      const order = Object.assign({}, req.body, paymentFields, {
        userId: userSnapshot.id,
        userEmail: userSnapshot.email,
        userName: userSnapshot.name,
        createdAt: now,
        status: 'confirmed',
        statusHistory: [{ status: 'confirmed', by: userSnapshot.email || userSnapshot.id || 'guest', at: now }],
        coupon: couponData,
        discountAmount: discountAmount,
        commissionAmount: commissionAmount,
        influencerId: influencerId
      });

    const result = await db.collection('orders').insertOne(order);
    const saved = await db.collection('orders').findOne({ _id: result.insertedId });

    // Update coupon usage and influencer stats
    if (couponData) {
      // Update coupon usage
      await db.collection('coupons').updateOne(
        { _id: couponData._id },
        { $inc: { usageCount: 1, totalDiscountGiven: discountAmount } }
      );

      // Update user coupon usage for user-specific coupons
      if (couponData.couponType === 'user-specific' && userSnapshot.id) {
        await db.collection('user_coupons').updateOne(
          { couponId: couponData._id, userId: new ObjectId(userSnapshot.id) },
          { $inc: { usageCount: 1 } }
        );
      }

      // Update influencer stats
      if (influencerId) {
        await db.collection('influencers').updateOne(
          { _id: influencerId },
          {
            $inc: {
              totalOrders: 1
            }
          }
        );
      }
    }

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
    // Debug: log how many orders we return and sample ids
    try {
      console.debug('orders.js: /all returning', orders.length, 'orders. sample ids:', orders.slice(0,5).map(o => (o._id && (o._id.toString ? o._id.toString() : o._id))));
    } catch (e) { console.warn('orders.js: /all debug log failed', e && e.message); }
    // Ensure paymentMethod is set for display
    const processedOrders = orders.map(order => {
      if (!order.paymentMethod) {
        if (order.payment && Object.keys(order.payment).some(k => k.includes('razorpay'))) {
          order.paymentMethod = 'Online';
        } else {
          order.paymentMethod = 'COD';
        }
      }
      return order;
    });
    return res.json(processedOrders);
  } catch (err) {
    next(err);
  }
});

// Get single order by id (owner or admin/dba/delivery)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const ObjectId = require('mongodb').ObjectId;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid order id' });
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const isOwner = order.userId === req.user.sub || order.userId === String(req.user.sub);
    const canAdmin = req.user.role && ['admin', 'dba', 'delivery'].includes(req.user.role);
    if (!isOwner && !canAdmin) return res.status(403).json({ error: 'Not allowed to view this order' });
    if (!order.paymentMethod) {
      if (order.payment && Object.keys(order.payment).some(k => k && k.includes('razorpay'))) order.paymentMethod = 'Online';
      else order.paymentMethod = 'COD';
    }
    return res.json(order);
  } catch (err) {
    next(err);
  }
});

// Allowed order statuses (only these 3)
const ALLOWED_STATUSES = ['confirmed', 'delivered', 'cancelled'];

// Admin: update order status
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.debug('orders.js: status update attempt', { id, status, user: req.user && { sub: req.user.sub, role: req.user.role, email: req.user.email } });
    if (!status) return res.status(400).json({ error: 'Missing status' });
    if (!ALLOWED_STATUSES.includes(status)) return res.status(400).json({ error: 'Status must be one of: confirmed, delivered, cancelled' });
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }
    const ObjectId = require('mongodb').ObjectId;

    // Try finding the order using several strategies to handle both ObjectId and string ids
    let found = null;
    const lookupCandidates = [];
    try { if (ObjectId.isValid(id)) lookupCandidates.push({ _id: new ObjectId(id) }); } catch (e) { /* ignore */ }
    lookupCandidates.push({ _id: id });
    lookupCandidates.push({ id: id });
    lookupCandidates.push({ orderId: id });

    for (const q of lookupCandidates) {
      try {
        found = await db.collection('orders').findOne(q);
        if (found) {
          console.debug('orders.js: found order using', q, '->', (found._id && found._id.toString ? found._id.toString() : found._id));
          break;
        }
      } catch (e) {
        console.warn('orders.js: lookup failed for', q, e && e.message);
      }
    }

    if (!found) {
      console.warn('orders.js: order not found', { id, tried: lookupCandidates.map(c => Object.keys(c)[0]) });
      const resp = { error: 'Order not found' };
      if (process.env.NODE_ENV !== 'production') {
        resp.tried = lookupCandidates;
      }
      return res.status(404).json(resp);
    }

    const actor = req.user && (req.user.email || req.user.sub) || 'admin';
    const update = {
      $set: { status: status },
      $push: { statusHistory: { status: status, by: actor, at: new Date() } }
    };

    const result = await db.collection('orders').findOneAndUpdate({ _id: found._id }, update, { returnDocument: 'after' });

    if (!result.value) {
      console.warn('orders.js: findOneAndUpdate returned no value (fallback)', { id: found._id, result });
      // Attempt a fallback: updateOne and then fetch the document
      try {
        const upd = await db.collection('orders').updateOne({ _id: found._id }, update);
        console.debug('orders.js: fallback updateOne result', { matchedCount: upd.matchedCount, modifiedCount: upd.modifiedCount });
        const doc = await db.collection('orders').findOne({ _id: found._id });
        if (doc) {
          try { events.emit('order_updated', doc); } catch (e) { console.warn('emit failed', e && e.message); }
          return res.json(doc);
        }
      } catch (e) {
        console.error('orders.js: fallback update failed', e && e.message);
      }
      // still not found
      const resp = { error: 'Order not found' };
      if (process.env.NODE_ENV !== 'production') {
        resp.lookup = lookupCandidates;
        resp.findOneAndUpdateResult = result;
      }
      return res.status(404).json(resp);
    }

    // emit update
    try { events.emit('order_updated', result.value); } catch (e) { console.warn('emit failed', e && e.message); }
    return res.json(result.value);
  } catch (err) {
    console.error('orders.js: status update error', err && err.stack ? err.stack : err);
    next(err);
  }
});

// Delivery: update order status and payment status (for COD)
router.patch('/:id/delivery-status', authMiddleware, deliveryMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    console.debug('orders.js: delivery-status update attempt', { id, status, paymentStatus, user: req.user && { sub: req.user.sub, role: req.user.role, email: req.user.email } });
    if (!status) return res.status(400).json({ error: 'Missing status' });
    if (!ALLOWED_STATUSES.includes(status)) return res.status(400).json({ error: 'Status must be one of: confirmed, delivered, cancelled' });

    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }

    const ObjectId = require('mongodb').ObjectId;

    // Lookup helper (handle string id, numeric id, _id and orderId)
    let found = null;
    const lookupCandidates = [];
    try { if (ObjectId.isValid(id)) lookupCandidates.push({ _id: new ObjectId(id) }); } catch (e) { /* ignore */ }
    lookupCandidates.push({ _id: id });
    lookupCandidates.push({ id: id });
    lookupCandidates.push({ orderId: id });

    for (const q of lookupCandidates) {
      try {
        found = await db.collection('orders').findOne(q);
        if (found) {
          console.debug('orders.js: delivery-status found order using', q, '->', (found._id && found._id.toString ? found._id.toString() : found._id));
          break;
        }
      } catch (e) {
        console.warn('orders.js: delivery-status lookup failed for', q, e && e.message);
      }
    }

    if (!found) {
      console.warn('orders.js: delivery-status order not found', { id, tried: lookupCandidates.map(c => Object.keys(c)[0]) });
      const resp = { error: 'Order not found' };
      if (process.env.NODE_ENV !== 'production') resp.tried = lookupCandidates;
      return res.status(404).json(resp);
    }

    const actor = req.user && (req.user.email || req.user.sub) || 'delivery';
    const update = {
      $set: { status: status },
      $push: { statusHistory: { status: status, by: actor, at: new Date() } }
    };

    // If payment status is provided and it's a COD order, update payment status too
    if (paymentStatus && (paymentStatus === 'paid' || paymentStatus === 'unpaid')) {
      update.$set.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') update.$set.paidAt = new Date();
      else update.$unset = { paidAt: '' };
    }

    // Try findOneAndUpdate on the found._id first to get the updated doc; fallback to updateOne+find
    const result = await db.collection('orders').findOneAndUpdate({ _id: found._id }, update, { returnDocument: 'after' });
    if (!result.value) {
      console.warn('orders.js: delivery-status findOneAndUpdate returned no value (fallback)', { id: found._id, result });
      try {
        const upd = await db.collection('orders').updateOne({ _id: found._id }, update);
        console.debug('orders.js: delivery-status fallback updateOne', { matchedCount: upd.matchedCount, modifiedCount: upd.modifiedCount });
        const doc = await db.collection('orders').findOne({ _id: found._id });
        if (doc) {
          try { events.emit('order_updated', doc); } catch (e) { console.warn('emit failed', e && e.message); }
          return res.json(doc);
        }
      } catch (e) {
        console.error('orders.js: delivery-status fallback update failed', e && e.message);
      }
      const resp = { error: 'Order not found' };
      if (process.env.NODE_ENV !== 'production') { resp.lookup = lookupCandidates; resp.findOneAndUpdateResult = result; }
      return res.status(404).json(resp);
    }

    // emit update
    try { events.emit('order_updated', result.value); } catch (e) { console.warn('emit failed', e && e.message); }
    return res.json(result.value);
  } catch (err) {
    console.error('orders.js: delivery-status error', err && err.stack ? err.stack : err);
    next(err);
  }
});

// Admin/DBA: update payment status (paid/unpaid)
router.patch('/:id/payment', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body; // expected 'paid' or 'unpaid'
    console.debug('orders.js: payment update attempt', { id, paymentStatus, user: req.user && { sub: req.user.sub, role: req.user.role, email: req.user.email } });
    if (!paymentStatus) return res.status(400).json({ error: 'Missing paymentStatus' });
    if (!['paid','unpaid'].includes(paymentStatus)) return res.status(400).json({ error: 'Invalid paymentStatus' });
    let db;
    try {
      db = await connect();
    } catch (err) {
      return res.status(500).json({ error: 'Database not configured or unavailable' });
    }
    const ObjectId = require('mongodb').ObjectId;

    // Lookup helper (handles ObjectId and string ids)
    let found = null;
    const lookupCandidates = [];
    try { if (ObjectId.isValid(id)) lookupCandidates.push({ _id: new ObjectId(id) }); } catch (e) { }
    lookupCandidates.push({ _id: id });
    lookupCandidates.push({ id: id });
    lookupCandidates.push({ orderId: id });

    for (const q of lookupCandidates) {
      try {
        found = await db.collection('orders').findOne(q);
        if (found) { console.debug('orders.js: found order for payment update using', q); break; }
      } catch (e) { console.warn('orders.js: lookup failed for', q, e && e.message); }
    }

    if (!found) {
      console.warn('orders.js: order not found for payment update', { id, tried: lookupCandidates.map(c => Object.keys(c)[0]) });
      const resp = { error: 'Order not found' };
      if (process.env.NODE_ENV !== 'production') resp.tried = lookupCandidates;
      return res.status(404).json(resp);
    }

    const actor = req.user && (req.user.email || req.user.sub) || 'admin';
    const now = new Date();
    const update = {
      $set: { paymentStatus: paymentStatus, paymentUpdatedAt: now },
      $push: { statusHistory: { status: `payment:${paymentStatus}`, by: actor, at: now } }
    };
    if (paymentStatus === 'paid') update.$set.paidAt = now; else update.$unset = { paidAt: '' };

    const result = await db.collection('orders').findOneAndUpdate({ _id: found._id }, update, { returnDocument: 'after' });

    if (!result.value) {
      console.warn('orders.js: findOneAndUpdate returned no value during payment update', { id: found._id, result });
      try {
        const upd = await db.collection('orders').updateOne({ _id: found._id }, update);
        console.debug('orders.js: fallback updateOne', { matchedCount: upd.matchedCount, modifiedCount: upd.modifiedCount });
        const doc = await db.collection('orders').findOne({ _id: found._id });
        if (doc) { try { events.emit('order_updated', doc); } catch (e) { console.warn('emit failed', e && e.message); } return res.json(doc); }
      } catch (e) { console.error('orders.js: fallback payment update failed', e && e.message); }
      const resp = { error: 'Order not found' };
      if (process.env.NODE_ENV !== 'production') { resp.lookup = lookupCandidates; resp.findOneAndUpdateResult = result; }
      return res.status(404).json(resp);
    }

    try { events.emit('order_updated', result.value); } catch (e) { console.warn('emit failed', e && e.message); }
    return res.json(result.value);
  } catch (err) {
    next(err);
  }
});

// Delivery: mark COD payment collected/uncollected (delivery personnel)
router.patch('/:id/payment-delivery', authMiddleware, deliveryMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body; // expected 'paid' or 'unpaid'
    if (!paymentStatus) return res.status(400).json({ error: 'Missing paymentStatus' });
    if (!['paid','unpaid'].includes(paymentStatus)) return res.status(400).json({ error: 'Invalid paymentStatus' });

    let db;
    try { db = await connect(); } catch (err) { return res.status(500).json({ error: 'Database not configured or unavailable' }); }
    const ObjectId = require('mongodb').ObjectId;

    // Only allow delivery personnel to mark COD payments
    // Lookup order by common candidates
    let found = null;
    const lookupCandidates = [];
    try { if (ObjectId.isValid(id)) lookupCandidates.push({ _id: new ObjectId(id) }); } catch (e) { }
    lookupCandidates.push({ _id: id });
    lookupCandidates.push({ id: id });
    lookupCandidates.push({ orderId: id });

    for (const q of lookupCandidates) {
      try {
        found = await db.collection('orders').findOne(q);
        if (found) break;
      } catch (e) { /* ignore individual lookup errors */ }
    }

    if (!found) return res.status(404).json({ error: 'Order not found' });

    const paymentMethod = (found.paymentMethod || '').toString().toUpperCase();
    if (!paymentMethod.includes('COD')) return res.status(403).json({ error: 'Only COD orders can be updated by delivery personnel' });

    const actor = req.user && (req.user.email || req.user.sub) || 'delivery';
    const now = new Date();
    const update = {
      $set: { paymentStatus: paymentStatus, paymentUpdatedAt: now },
      $push: { statusHistory: { status: `payment:${paymentStatus}`, by: actor, at: now } }
    };
    if (paymentStatus === 'paid') update.$set.paidAt = now; else update.$unset = { paidAt: '' };

    const result = await db.collection('orders').findOneAndUpdate({ _id: found._id }, update, { returnDocument: 'after' });
    if (!result.value) {
      // fallback
      try {
        await db.collection('orders').updateOne({ _id: found._id }, update);
        const doc = await db.collection('orders').findOne({ _id: found._id });
        if (doc) { try { events.emit('order_updated', doc); } catch (e) { /* ignore */ } return res.json(doc); }
      } catch (e) { console.error('payment-delivery fallback failed', e && e.message); }
      return res.status(500).json({ error: 'Could not update payment' });
    }

    try { events.emit('order_updated', result.value); } catch (e) { console.warn('emit failed', e && e.message); }
    return res.json(result.value);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

