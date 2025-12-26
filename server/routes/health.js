var express = require('express');
var router = express.Router();
const { connect, getClient } = require('../lib/mongoClient');

// Health check: verifies MongoDB connectivity
router.get('/', async (req, res) => {
  try {
    const start = Date.now();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    try {
      const db = await connect();
      // simple ping
      const admin = db.admin ? db.admin() : null;
      if (admin && admin.ping) {
        await admin.ping();
      }
      const responseTime = Date.now() - start;
      return res.json({
        ok: true,
        db: true,
        uptime: uptime,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        responseTime: responseTime
      });
    } catch (err) {
      return res.status(500).json({ ok: false, db: false, error: err.message || 'DB error' });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
});

module.exports = router;
