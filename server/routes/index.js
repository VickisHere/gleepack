var express = require('express');
var router = express.Router();

/* GET health check / API status */
router.get('/', function(req, res, next) {
  res.json({ 
    status: 'ok',
    message: 'GleePack API Server',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
