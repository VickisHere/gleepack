var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const { connect } = require('../lib/mongoClient');
const ObjectId = require('mongodb').ObjectId;

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';

// Dev-only: promote current user (from token) to admin for local testing
router.post('/promote', async (req, res) => {
  // Only allow in non-production
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization header' });
  const token = parts[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // payload expected to have `email` and `sub`
  try {
    const db = await connect();
    const query = payload.email ? { email: payload.email } : { _id: ObjectId.isValid(payload.sub) ? new ObjectId(payload.sub) : payload.sub };
    const update = { $set: { role: 'admin' } };
    await db.collection('users').updateOne(query, update);
    const u = await db.collection('users').findOne(query);
    return res.json({ ok: true, user: { id: String(u._id), email: u.email, role: u.role } });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

module.exports = router;
