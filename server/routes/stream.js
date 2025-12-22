var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const events = require('../lib/events');
const { connect } = require('../lib/mongoClient');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';

function verifyTokenFromQuery(req) {
  const token = req.query.token || null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Server-Sent Events stream for orders.
// If client provides a valid admin/employee token via ?token=..., they receive all order events.
// If client provides a user token, they receive events related to their userId only.
router.get('/orders', async (req, res) => {
  // set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const payload = verifyTokenFromQuery(req);
  const isAdmin = payload && (payload.role === 'admin' || payload.role === 'employee');
  const userId = payload && payload.sub ? String(payload.sub) : null;

  const writeEvent = (eventName, data) => {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // ignore
    }
  };

  // Send an initial ping
  writeEvent('connected', { ok: true, role: payload ? payload.role : 'guest' });

  const onCreated = (order) => {
    if (isAdmin) return writeEvent('order_created', order);
    if (userId && String(order.userId) === String(userId)) return writeEvent('order_created', order);
  };

  const onUpdated = (order) => {
    if (isAdmin) return writeEvent('order_updated', order);
    if (userId && String(order.userId) === String(userId)) return writeEvent('order_updated', order);
  };

  events.on('order_created', onCreated);
  events.on('order_updated', onUpdated);

  // Keep connection open. Clean up when client disconnects.
  req.on('close', () => {
    events.removeListener('order_created', onCreated);
    events.removeListener('order_updated', onUpdated);
  });
});

module.exports = router;
