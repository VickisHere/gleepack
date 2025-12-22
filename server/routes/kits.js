var express = require('express');
var router = express.Router();
const { connect } = require('../lib/mongoClient');

router.get('/', async (req, res, next) => {
    try {
        const db = await connect();
        const kits = await db.collection('kits').find({}).toArray();
        res.json(kits);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const db = await connect();
        const kit = await db.collection('kits').findOne({ id: req.params.id });
        if (!kit) return res.status(404).json({ error: 'Not found' });
        res.json(kit);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
