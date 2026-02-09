const express = require('express');
const router = express.Router();
let Razorpay;
let razor = null;
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { connect } = require('../lib/mongoClient');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';
try {
  Razorpay = require('razorpay');
  razor = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || '', key_secret: process.env.RAZORPAY_KEY_SECRET || '' });
} catch (e) {
  console.warn('razorpay module not available; payment endpoints will be limited');
}

// create razorpay order and return order id + key id
router.post('/razorpay/order', async (req, res) => {
  try {
    if (!razor) return res.status(501).json({ error: 'Razorpay not configured on server' });
    const { amount, currency = 'INR', receipt } = req.body || {};
    if (!amount) return res.status(400).json({ error: 'Missing amount' });
    const rpOrder = await razor.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
    });
    return res.json({ orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency, keyId: process.env.RAZORPAY_KEY_ID || '' });
  } catch (err) {
    console.error('razorpay order create error', err);
    return res.status(500).json({ error: 'Could not create razorpay order' });
  }
});

// verify signature coming from client after checkout and create an order record
router.post('/razorpay/verify', express.json(), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: 'Missing payment verification fields' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ error: 'Invalid signature' });

    // signature valid — create order in DB (or update existing record if you chose to pre-create)
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;
    const now = new Date();
    // try to extract user from Authorization header (if client used apiFetch)
    let userId = null;
    let userEmail = null;
    try {
      const auth = req.headers.authorization;
      if (auth) {
        const parts = String(auth).split(' ');
        if (parts.length === 2) {
          const payload = jwt.verify(parts[1], JWT_SECRET);
          if (payload) {
            userId = payload.sub || payload.id || null;
            userEmail = payload.email || payload.userEmail || null;
          }
        }
      }
    } catch (e) {
      // ignore token errors
    }

    const actor = userEmail || (orderPayload && orderPayload.contact && orderPayload.contact.email) || 'guest';

    // Determine payment method from orderPayload
    const incomingPaymentMethod = orderPayload && orderPayload.paymentMethod ? String(orderPayload.paymentMethod).toLowerCase() : 'online';
    let paymentMethod = incomingPaymentMethod;
    
    // Normalize payment method names for display
    if (paymentMethod === 'cod') {
      paymentMethod = 'COD';
    } else {
      paymentMethod = 'Online';
    }

    const orderDoc = Object.assign({}, orderPayload || {}, {
      userId,
      userEmail,
      paymentMethod: paymentMethod,
      paymentStatus: 'paid',
      paidAt: now,
      paymentUpdatedAt: now,
      payment: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      createdAt: now,
      status: 'confirmed',
      statusHistory: [{ status: 'confirmed', by: actor, at: now }, { status: `payment:paid`, by: actor, at: now }],
    });

    const result = await db.collection('orders').insertOne(orderDoc);
    const saved = await db.collection('orders').findOne({ _id: result.insertedId });
    return res.json({ ok: true, order: saved });
  } catch (err) {
    console.error('razorpay verify error', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// webhook endpoint for Razorpay (use raw body when mounting this route)
router.post('/razorpay/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body; // buffer
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expected) return res.status(400).send('invalid signature');
    const payload = JSON.parse(body.toString());
    // handle payment.captured etc.
    const event = payload.event;
    try {
      const db = await connect();
      if (event === 'payment.captured' || event === 'payment.authorized') {
        const payment = payload.payload.payment.entity;
        const rpOrderId = payment.order_id;
        // try to find an order that references this rp order id in payment.orderId or payment.razorpay_order_id
        const q = { $or: [ { 'payment.razorpay_order_id': rpOrderId }, { 'payment.order_id': rpOrderId }, { 'paymentOrderId': rpOrderId } ] };
        const now = new Date();
        const update = { $set: { paymentStatus: 'paid', paidAt: now, paymentUpdatedAt: now }, $push: { statusHistory: { status: 'payment:paid', by: 'razorpay-webhook', at: now } } };
        await db.collection('orders').updateOne(q, update);
      }
    } catch (e) {
      console.warn('webhook DB update failed', e && e.message);
    }
    return res.status(200).send('ok');
  } catch (err) {
    console.error('webhook processing failed', err);
    return res.status(500).send('error');
  }
});

module.exports = router;
