var express = require('express');
var router = express.Router();
const { connect } = require('../lib/mongoClient');

/* GET users listing from MongoDB `users` collection. */
router.get('/', async function(req, res, next) {
  try {
    const db = await connect();
    const users = await db.collection('users').find({}).toArray();
    return res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
