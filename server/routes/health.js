var express = require('express');
var router = express.Router();
const { connect, getClient } = require('../lib/mongoClient');

// Health check: verifies MongoDB connectivity
router.get('/', async (req, res) => {
  try {
    try {
      const db = await connect();
      // simple ping
      const admin = db.admin ? db.admin() : null;
      if (admin && admin.ping) {
        await admin.ping();
      }
      return res.json({ ok: true, db: true });
    } catch (err) {
      return res.status(500).json({ ok: false, db: false, error: err.message || 'DB error' });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
});

module.exports = router;
