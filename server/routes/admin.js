var express = require('express');
var router = express.Router();
const { connect } = require('../lib/mongoClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

function superAdminMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // only allow super admin
  if (req.user.role && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Super Admin access required' });
}

function adminMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // allow admin or dba role for admin operations
  if (req.user.role && (req.user.role === 'admin' || req.user.role === 'dba')) return next();
  return res.status(403).json({ error: 'Admin access required' });
}

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const users = await db.collection('users').find({}).project({ password: 0 }).toArray();
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get employee list (DBA or Admin) - returns only users with employee roles
router.get('/users/employees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const employees = await db.collection('users').find({ role: { $in: ['dba', 'delivery'] } }).project({ password: 0 }).toArray();
    return res.json(employees);
  } catch (err) {
    console.error('Error fetching employees:', err);
    return res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Create DBA account (admin only)
router.post('/users/dba', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const db = await connect();
    const existing = await db.collection('users').findOne({ email });
    if (!existing) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    await db.collection('users').updateOne({ email }, { $set: { role: 'dba', name } });
    const user = await db.collection('users').findOne({ email }, { projection: { password: 0 } });
    return res.json({ user });
  } catch (err) {
    console.error('Error creating DBA:', err);
    return res.status(500).json({ error: 'Failed to create DBA account' });
  }
});

// Create delivery boy account (admin or dba)
router.post('/users/delivery', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const db = await connect();
    const existing = await db.collection('users').findOne({ email });
    if (!existing) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    await db.collection('users').updateOne({ email }, { $set: { role: 'delivery', name } });
    const user = await db.collection('users').findOne({ email }, { projection: { password: 0 } });
    return res.json({ user });
  } catch (err) {
    console.error('Error creating delivery boy:', err);
    return res.status(500).json({ error: 'Failed to create delivery boy account' });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'delivery', 'dba'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be customer, delivery, or dba' });
    }

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date(), updatedBy: req.user.sub } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
    return res.json({ user });
  } catch (err) {
    console.error('Error updating user role:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (admin only, cannot delete admin)
router.delete('/users/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Check if user exists and is not admin
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Placeholder admin routes
router.get('/', function(req, res, next) {
  res.json({ ok: true, message: 'admin root' });
});

module.exports = router;
