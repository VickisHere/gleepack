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
  // only allow admin role
  if (req.user.role && req.user.role.toLowerCase() === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
}

function adminOrDbaMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // allow both admin and dba roles
  if (req.user.role && (req.user.role.toLowerCase() === 'admin' || req.user.role.toLowerCase() === 'dba')) return next();
  return res.status(403).json({ error: 'Admin or DBA access required' });
}

// ============ ADMIN MANAGEMENT ROUTES ============

// Get all admins
router.get('/admins', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const admins = await db.collection('admins').find({}).project({ password: 0 }).toArray();
    return res.json(admins);
  } catch (err) {
    console.error('Error fetching admins:', err);
    return res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Create admin (admin only)
router.post('/admins', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await connect();
    
    // Check if admin already exists
    const existing = await db.collection('admins').findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Admin with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.collection('admins').insertOne({
      email,
      password: hash,
      name,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const admin = await db.collection('admins').findOne({ _id: result.insertedId }, { projection: { password: 0 } });
    return res.status(201).json(admin);
  } catch (err) {
    console.error('Error creating admin:', err);
    return res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Update admin details
router.patch('/admins/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    updates.updatedAt = new Date();

    const result = await db.collection('admins').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.json(result.value);
  } catch (err) {
    console.error('Error updating admin:', err);
    return res.status(500).json({ error: 'Failed to update admin' });
  }
});

// Delete admin
router.delete('/admins/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    const result = await db.collection('admins').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Error deleting admin:', err);
    return res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ============ DBA MANAGEMENT ROUTES ============

// Get all DBAs
router.get('/dbas', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const dbas = await db.collection('dbas').find({}).project({ password: 0 }).toArray();
    return res.json(dbas);
  } catch (err) {
    console.error('Error fetching DBAs:', err);
    return res.status(500).json({ error: 'Failed to fetch DBAs' });
  }
});

// Create DBA (admin only)
router.post('/dbas', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await connect();
    
    // Check if DBA already exists
    const existing = await db.collection('dbas').findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'DBA with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.collection('dbas').insertOne({
      email,
      password: hash,
      name,
      role: 'dba',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const dba = await db.collection('dbas').findOne({ _id: result.insertedId }, { projection: { password: 0 } });
    return res.status(201).json(dba);
  } catch (err) {
    console.error('Error creating DBA:', err);
    return res.status(500).json({ error: 'Failed to create DBA' });
  }
});

// Update DBA details
router.patch('/dbas/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    updates.updatedAt = new Date();

    const result = await db.collection('dbas').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'DBA not found' });
    }

    return res.json(result.value);
  } catch (err) {
    console.error('Error updating DBA:', err);
    return res.status(500).json({ error: 'Failed to update DBA' });
  }
});

// Delete DBA
router.delete('/dbas/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    const result = await db.collection('dbas').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'DBA not found' });
    }

    return res.json({ message: 'DBA deleted successfully' });
  } catch (err) {
    console.error('Error deleting DBA:', err);
    return res.status(500).json({ error: 'Failed to delete DBA' });
  }
});

// ============ EXISTING USER ROUTES ============
router.get('/users', authMiddleware, adminOrDbaMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await db.collection('users').find(query).project({ password: 0 }).toArray();
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get employee list (admin or DBA) - returns only users with employee roles
router.get('/users/employees', authMiddleware, adminOrDbaMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const employees = await db.collection('users').find({ role: { $in: ['dba', 'delivery', 'gim'] } }).project({ password: 0 }).toArray();
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
router.post('/users/delivery', authMiddleware, adminOrDbaMiddleware, async (req, res) => {
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

// Create GIM account (admin only)
router.post('/users/gim', authMiddleware, superAdminMiddleware, async (req, res) => {
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

    await db.collection('users').updateOne({ email }, { $set: { role: 'gim', name } });
    const user = await db.collection('users').findOne({ email }, { projection: { password: 0 } });
    return res.json({ user });
  } catch (err) {
    console.error('Error creating GIM:', err);
    return res.status(500).json({ error: 'Failed to create GIM account' });
  }
});

// Create influencer account (admin only) - assign influencer role to existing user
router.post('/users/influencer', authMiddleware, superAdminMiddleware, async (req, res) => {
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

    await db.collection('users').updateOne({ email }, { $set: { role: 'influencer', name } });
    const user = await db.collection('users').findOne({ email }, { projection: { password: 0 } });
    return res.json({ user });
  } catch (err) {
    console.error('Error creating influencer:', err);
    return res.status(500).json({ error: 'Failed to create influencer account' });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'delivery', 'dba', 'gim'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be customer, delivery, dba, or gim' });
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

// Coupon Management Routes

// Get all coupons
router.get('/coupons', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const coupons = await db.collection('coupons').find({}).toArray();
    return res.json(coupons);
  } catch (err) {
    console.error('Error fetching coupons:', err);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Create coupon
router.post('/coupons', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { code, name, type, value, minOrderValue, maxDiscount, startDate, expiryDate, totalUsageLimit, perUserLimit } = req.body;
    if (!code || !name || !type || !value || !startDate || !expiryDate) {
      return res.status(400).json({ error: 'Required fields: code, name, type, value, startDate, expiryDate' });
    }
    if (!['flat', 'percentage'].includes(type)) {
      return res.status(400).json({ error: 'Type must be flat or percentage' });
    }

    const db = await connect();
    const existing = await db.collection('coupons').findOne({ code });
    if (existing) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

    const coupon = {
      code: code.toUpperCase(),
      name,
      type,
      value: Number(value),
      minOrderValue: minOrderValue ? Number(minOrderValue) : null,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      isActive: true,
      usageCount: 0,
      totalDiscountGiven: 0,
      createdBy: req.user.sub,
      createdAt: new Date()
    };

    const result = await db.collection('coupons').insertOne(coupon);
    coupon._id = result.insertedId;
    return res.status(201).json(coupon);
  } catch (err) {
    console.error('Error creating coupon:', err);
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Update coupon
router.patch('/coupons/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Validate type if provided
    if (updates.type && !['flat', 'percentage'].includes(updates.type)) {
      return res.status(400).json({ error: 'Type must be flat or percentage' });
    }

    // Convert dates
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate);

    // Convert numbers
    if (updates.value) updates.value = Number(updates.value);
    if (updates.minOrderValue) updates.minOrderValue = Number(updates.minOrderValue);
    if (updates.maxDiscount) updates.maxDiscount = Number(updates.maxDiscount);
    if (updates.totalUsageLimit) updates.totalUsageLimit = Number(updates.totalUsageLimit);
    if (updates.perUserLimit) updates.perUserLimit = Number(updates.perUserLimit);

    const result = await db.collection('coupons').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnOriginal: false }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.json(result.value);
  } catch (err) {
    console.error('Error updating coupon:', err);
    return res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Delete coupon
router.delete('/coupons/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    const result = await db.collection('coupons').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Assign coupon to user
router.post('/coupons/assign', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { couponId, userId, customValue } = req.body;
    if (!couponId || !userId) {
      return res.status(400).json({ error: 'couponId and userId required' });
    }

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Check if coupon exists
    const coupon = await db.collection('coupons').findOne({ _id: new ObjectId(couponId) });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Check if user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already assigned
    const existing = await db.collection('user_coupons').findOne({ couponId: new ObjectId(couponId), userId: new ObjectId(userId) });
    if (existing) {
      return res.status(409).json({ error: 'Coupon already assigned to this user' });
    }

    const assignedCoupon = {
      couponId: new ObjectId(couponId),
      userId: new ObjectId(userId),
      customValue: customValue ? Number(customValue) : null,
      usageCount: 0,
      assignedAt: new Date()
    };

    await db.collection('user_coupons').insertOne(assignedCoupon);
    return res.status(201).json(assignedCoupon);
  } catch (err) {
    console.error('Error assigning coupon:', err);
    return res.status(500).json({ error: 'Failed to assign coupon' });
  }
});

// Get assigned coupons for a user
router.get('/coupons/user/:userId', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    const assignedCoupons = await db.collection('user_coupons').aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $lookup: {
          from: 'coupons',
          localField: 'couponId',
          foreignField: '_id',
          as: 'coupon'
        }
      },
      { $unwind: '$coupon' }
    ]).toArray();

    return res.json(assignedCoupons);
  } catch (err) {
    console.error('Error fetching user coupons:', err);
    return res.status(500).json({ error: 'Failed to fetch user coupons' });
  }
});

// Placeholder admin routes
router.get('/', function(req, res, next) {
  res.json({ ok: true, message: 'admin root' });
});

// Influencer Management Routes

// Get all influencers
router.get('/influencers', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const influencers = await db.collection('influencers').find({}).toArray();
    return res.json(influencers);
  } catch (err) {
    console.error('Error fetching influencers:', err);
    return res.status(500).json({ error: 'Failed to fetch influencers' });
  }
});

// Create influencer
router.post('/influencers', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const {
      email,
      name,
      couponCode,
      customerDiscountType,
      customerDiscountValue,
      commissionPercentage,
      validityType,
      expiryDate,
      totalUsageLimit,
      perUserLimit,
      showOrderAmount
    } = req.body;

    if (!email || !couponCode || !customerDiscountType || !customerDiscountValue || !commissionPercentage) {
      return res.status(400).json({ error: 'Required fields: email, couponCode, customerDiscountType, customerDiscountValue, commissionPercentage' });
    }

    if (!['flat', 'percentage'].includes(customerDiscountType)) {
      return res.status(400).json({ error: 'customerDiscountType must be flat or percentage' });
    }

    const db = await connect();

    // Check if coupon code already exists
    const existingCoupon = await db.collection('coupons').findOne({ code: couponCode.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

    // Check if user exists, if not create one
    let user = await db.collection('users').findOne({ email });
    let userId;
    let defaultPassword = null;

    if (!user) {
      // Create user account for influencer
      const hash = await bcrypt.hash('influencer123', 10);
      const userResult = await db.collection('users').insertOne({
        email,
        password: hash,
        name,
        role: 'influencer',
        createdAt: new Date()
      });
      userId = userResult.insertedId;
      defaultPassword = 'influencer123';
    } else {
      // Update existing user to have influencer role
      await db.collection('users').updateOne({ email }, { $set: { role: 'influencer', name } });
      userId = user._id;

      // Check if influencer profile already exists for this user
      const existingInfluencer = await db.collection('influencers').findOne({ userId });
      if (existingInfluencer) {
        return res.status(409).json({ error: 'Influencer profile already exists for this user' });
      }
    }

    // Create influencer
    const influencer = {
      email,
      name,
      couponCode: couponCode.toUpperCase(),
      customerDiscountType,
      customerDiscountValue: Number(customerDiscountValue),
      commissionPercentage: Number(commissionPercentage),
      validityType: validityType || 'unlimited',
      expiryDate: expiryDate ? new Date(expiryDate) : new Date('2099-12-31T23:59'),
      totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      showOrderAmount: showOrderAmount || false,
      isActive: true,
      totalOrders: 0,
      totalCommissionEarned: 0,
      userId: userId,
      createdBy: req.user.sub,
      createdAt: new Date()
    };

    const result = await db.collection('influencers').insertOne(influencer);
    influencer._id = result.insertedId;

    // Create corresponding coupon
    const coupon = {
      code: couponCode.toUpperCase(),
      name: `Influencer: ${name}`,
      type: customerDiscountType,
      value: Number(customerDiscountValue),
      minOrderValue: null,
      maxDiscount: null,
      startDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date('2099-12-31T23:59'),
      totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      isActive: true,
      usageCount: 0,
      totalDiscountGiven: 0,
      isInfluencerCoupon: true,
      influencerId: influencer._id,
      commissionPercentage: Number(commissionPercentage),
      createdBy: req.user.sub,
      createdAt: new Date()
    };

    await db.collection('coupons').insertOne(coupon);

    const response = { ...influencer };
    if (defaultPassword) {
      response.defaultPassword = defaultPassword;
    }

    return res.status(201).json(response);
  } catch (err) {
    console.error('Error creating influencer:', err);
    return res.status(500).json({ error: 'Failed to create influencer' });
  }
});

// Update influencer
router.patch('/influencers/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Validate updates
    if (updates.customerDiscountType && !['flat', 'percentage'].includes(updates.customerDiscountType)) {
      return res.status(400).json({ error: 'customerDiscountType must be flat or percentage' });
    }

    // Convert numbers
    if (updates.customerDiscountValue) updates.customerDiscountValue = Number(updates.customerDiscountValue);
    if (updates.commissionPercentage) updates.commissionPercentage = Number(updates.commissionPercentage);
    if (updates.totalUsageLimit) updates.totalUsageLimit = Number(updates.totalUsageLimit);
    if (updates.perUserLimit) updates.perUserLimit = Number(updates.perUserLimit);
    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate);

    const result = await db.collection('influencers').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnOriginal: false }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Also update the corresponding coupon if certain fields changed
    if (updates.customerDiscountType || updates.customerDiscountValue || updates.expiryDate || updates.totalUsageLimit || updates.perUserLimit || updates.isActive !== undefined) {
      const couponUpdates = {};
      if (updates.customerDiscountType) couponUpdates.type = updates.customerDiscountType;
      if (updates.customerDiscountValue) couponUpdates.value = updates.customerDiscountValue;
      if (updates.expiryDate) couponUpdates.expiryDate = updates.expiryDate;
      if (updates.totalUsageLimit !== undefined) couponUpdates.totalUsageLimit = updates.totalUsageLimit;
      if (updates.perUserLimit) couponUpdates.perUserLimit = updates.perUserLimit;
      if (updates.isActive !== undefined) couponUpdates.isActive = updates.isActive;

      await db.collection('coupons').updateOne(
        { influencerId: new ObjectId(id) },
        { $set: couponUpdates }
      );
    }

    return res.json(result.value);
  } catch (err) {
    console.error('Error updating influencer:', err);
    return res.status(500).json({ error: 'Failed to update influencer' });
  }
});

// Delete influencer
router.delete('/influencers/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Delete influencer
    const result = await db.collection('influencers').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Delete corresponding coupon
    await db.collection('coupons').deleteOne({ influencerId: new ObjectId(id) });

    return res.json({ message: 'Influencer deleted successfully' });
  } catch (err) {
    console.error('Error deleting influencer:', err);
    return res.status(500).json({ error: 'Failed to delete influencer' });
  }
});

// Get influencer dashboard
router.get('/influencers/:id/dashboard', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Get influencer
    const influencer = await db.collection('influencers').findOne({ _id: new ObjectId(id) });
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Find all coupons for this influencer
    const coupons = await db.collection('coupons').find({ influencerId: influencer._id }).toArray();

    // Find orders using any of these coupons that are delivered and paid (completed orders)
    const couponCodes = coupons.map(c => c.code);
    const orders = await db.collection('orders').find({
      'coupon.code': { $in: couponCodes },
      status: 'delivered',
      paymentStatus: 'paid'
    }).sort({ createdAt: -1 }).limit(50).toArray();

    // Calculate stats
    const totalOrders = orders.length;
    const totalCommissionEarned = orders.reduce((sum, order) => sum + (Number(order.commissionAmount) || 0), 0);

    // Today and this month commissions
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
    const thisMonthOrders = orders.filter(order => new Date(order.createdAt) >= thisMonth);

    const todayCommission = todayOrders.reduce((sum, order) => sum + (Number(order.commissionAmount) || 0), 0);
    const thisMonthCommission = thisMonthOrders.reduce((sum, order) => sum + (Number(order.commissionAmount) || 0), 0);

    // Get user info
    const user = await db.collection('users').findOne({ _id: influencer.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      coupons: coupons.map(coupon => ({
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        expiryDate: coupon.expiryDate,
        usageCount: coupon.usageCount,
        totalUsageLimit: coupon.totalUsageLimit,
        active: coupon.isActive
      })),
      commissionRevenue: totalCommissionEarned,
      couponOrders: {
        count: totalOrders,
        orders: orders.slice(0, 10).map(order => ({
          id: order._id,
          total: order.total,
          commission: order.commissionAmount,
          createdAt: order.createdAt
        }))
      },
      stats: {
        totalOrders,
        totalCommissionEarned,
        todayCommission,
        thisMonthCommission
      },
      orders: orders.map(order => ({
        _id: order._id,
        total: influencer.showOrderAmount ? order.total : null,
        createdAt: order.createdAt,
        status: order.status,
        couponCode: order.coupon?.code,
        commissionAmount: order.commissionAmount
      })),
      showOrderAmount: influencer.showOrderAmount
    });
  } catch (err) {
    console.error('Error fetching influencer dashboard:', err);
    return res.status(500).json({ error: 'Failed to fetch influencer dashboard' });
  }
});

// Create coupon for existing influencer
router.post('/influencers/:id/coupons', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      couponCode,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      couponUsageType,
      totalUsageLimit,
      perUserLimit,
      expiryDate,
      status
    } = req.body;

    if (!couponCode || !discountType || !discountValue || !couponUsageType) {
      return res.status(400).json({ error: 'Required fields: couponCode, discountType, discountValue, couponUsageType' });
    }

    if (!['flat', 'percentage'].includes(discountType)) {
      return res.status(400).json({ error: 'discountType must be flat or percentage' });
    }

    if (!['unlimited', 'limited'].includes(couponUsageType)) {
      return res.status(400).json({ error: 'couponUsageType must be unlimited or limited' });
    }

    // Validation for limited coupons
    if (couponUsageType === 'limited') {
      if (!totalUsageLimit || !expiryDate) {
        return res.status(400).json({ error: 'Limited coupons require totalUsageLimit and expiryDate' });
      }
    } else {
      // Unlimited coupons
      if (expiryDate) {
        return res.status(400).json({ error: 'Unlimited coupons cannot have expiryDate' });
      }
    }

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Check if influencer exists
    const influencer = await db.collection('influencers').findOne({ _id: new ObjectId(id) });
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Check if coupon code already exists
    const existingCoupon = await db.collection('coupons').findOne({ code: couponCode.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

    // Create coupon
    const coupon = {
      code: couponCode.toUpperCase(),
      name: `Influencer: ${influencer.name} - ${couponCode}`,
      type: discountType,
      value: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : null,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startDate: new Date(),
      expiryDate: couponUsageType === 'limited' ? new Date(expiryDate) : new Date('2099-12-31T23:59'),
      totalUsageLimit: couponUsageType === 'limited' ? Number(totalUsageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      isActive: status === 'active',
      usageCount: 0,
      totalDiscountGiven: 0,
      isInfluencerCoupon: true,
      influencerId: influencer._id,
      commissionPercentage: influencer.commissionPercentage,
      createdBy: req.user.sub,
      createdAt: new Date()
    };

    const result = await db.collection('coupons').insertOne(coupon);

    return res.status(201).json({
      ...coupon,
      _id: result.insertedId
    });
  } catch (err) {
    console.error('Error creating coupon:', err);
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Update influencer coupon status
router.patch('/influencers/:influencerId/coupons/:couponId', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { influencerId, couponId } = req.params;
    const { active } = req.body;

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Check if influencer exists
    const influencer = await db.collection('influencers').findOne({ _id: new ObjectId(influencerId) });
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Check if coupon exists and belongs to this influencer
    const coupon = await db.collection('coupons').findOne({
      _id: new ObjectId(couponId),
      influencerId: new ObjectId(influencerId)
    });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found or does not belong to this influencer' });
    }

    // Update coupon status
    await db.collection('coupons').updateOne(
      { _id: new ObjectId(couponId) },
      { $set: { isActive: active } }
    );

    return res.json({ message: 'Coupon status updated successfully' });
  } catch (err) {
    console.error('Error updating coupon status:', err);
    return res.status(500).json({ error: 'Failed to update coupon status' });
  }
});

// Delete influencer coupon
router.delete('/influencers/:influencerId/coupons/:couponId', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { influencerId, couponId } = req.params;

    if (!influencerId || influencerId === 'undefined') {
      return res.status(400).json({ error: 'Invalid influencer ID' });
    }

    if (!couponId || couponId === 'undefined') {
      return res.status(400).json({ error: 'Invalid coupon ID' });
    }

    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    // Check if influencer exists
    const influencer = await db.collection('influencers').findOne({ _id: new ObjectId(influencerId) });
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Check if coupon exists and belongs to this influencer
    const coupon = await db.collection('coupons').findOne({
      _id: new ObjectId(couponId),
      influencerId: new ObjectId(influencerId)
    });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found or does not belong to this influencer' });
    }

    // Delete the coupon
    await db.collection('coupons').deleteOne({ _id: new ObjectId(couponId) });

    return res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;
