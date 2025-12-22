var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const { connect } = require('../lib/mongoClient');

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

// GET current user's profile
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  try {
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;
    const _id = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid user id' });
    const obj = await db.collection('users').findOne({ _id });
    if (!obj) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: String(obj._id), email: obj.email, name: obj.name, addresses: obj.addresses || [], createdAt: obj.createdAt });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Update current user's profile (allow updating name and addresses)
router.put('/', authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { name, addresses } = req.body;
  try {
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;
    const _id = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid user id' });
    const update = { $set: { name, addresses } };
    await db.collection('users').updateOne({ _id }, update);
    const obj = await db.collection('users').findOne({ _id });
    return res.json({ id: String(obj._id), email: obj.email, name: obj.name, addresses: obj.addresses || [], createdAt: obj.createdAt });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

module.exports = router;
