var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
const { connect } = require('../lib/mongoClient');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'invalid input' });
    if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

    // Only allow role specification for admin-created accounts, default to customer for public registration
    const userRole = role || 'customer';

    // Try to register in MongoDB, but fall back to a dev JSON file when DB is unavailable
    let db;
    try {
      db = await connect();
    } catch (err) {
      console.warn('Register: DB connect failed, falling back to dev users file', err && err.message ? err.message : err);
      if (process.env.NODE_ENV === 'production') return res.status(500).json({ error: 'Database not configured or unavailable' });

      // dev fallback: write to server/data/users.json
      try {
        const usersPath = path.join(__dirname, '..', 'data', 'users.json');
        let arr = [];
        if (fs.existsSync(usersPath)) {
          arr = JSON.parse(fs.readFileSync(usersPath, 'utf8')) || [];
        }
        if (arr.find(u => u.email === email)) return res.status(409).json({ error: 'User already exists' });
        const newUser = { id: `dev-${Date.now()}`, email, password, name: name || null, role: userRole, createdAt: new Date().toISOString() };
        arr.push(newUser);
        fs.writeFileSync(usersPath, JSON.stringify(arr, null, 2));
        const token = jwt.sign({ sub: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }, token });
      } catch (e) {
        console.error('Register dev fallback error', e && e.stack ? e.stack : e);
        return res.status(500).json({ error: 'Could not register user' });
      }
    }

    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    // Allow role specification (used by admin endpoints)
    const result = await db.collection('users').insertOne({ email, password: hash, name: name || null, role: userRole, createdAt: new Date() });
    const userId = result.insertedId;
    const user = await db.collection('users').findOne({ _id: userId });
    const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Assign welcome coupon
    try {
      const welcomeCoupon = await db.collection('coupons').findOne({ code: 'WELCOME' });
      if (welcomeCoupon) {
        await db.collection('user_coupons').insertOne({
          couponId: welcomeCoupon._id,
          userId: userId,
          usageCount: 0,
          assignedAt: new Date()
        });
      }
    } catch (e) {
      console.warn('Failed to assign welcome coupon', e);
    }

    return res.json({ user: { id: String(user._id), email: user.email, name: user.name, role: user.role }, token });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.debug('POST /api/auth/login request for', { email });
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    // Require MongoDB for login
    let db;
    try {
      db = await connect();
      // Check admins first
      const admin = await db.collection('admins').findOne({ email });
      if (admin) {
        const validAdmin = await bcrypt.compare(password, admin.password);
        if (!validAdmin) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ sub: String(admin._id), email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
        console.debug('Admin login successful for', { email, role: admin.role });
        return res.json({ user: { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role }, token });
      }

      // Then check DBAs
      const dba = await db.collection('dbas').findOne({ email });
      if (dba) {
        const validDba = await bcrypt.compare(password, dba.password);
        if (!validDba) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ sub: String(dba._id), email: dba.email, role: dba.role }, JWT_SECRET, { expiresIn: '7d' });
        console.debug('DBA login successful for', { email, role: dba.role });
        return res.json({ user: { id: String(dba._id), email: dba.email, name: dba.name, role: dba.role }, token });
      }

      // Fallback to regular users
      const user = await db.collection('users').findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      console.debug('Login successful for', { email, role: user.role });
      return res.json({ user: { id: String(user._id), email: user.email, name: user.name, role: user.role }, token });
    } catch (err) {
      
      
      console.error('Login: DB connect failed or error', err && err.message ? err.message : err);
      if (process.env.NODE_ENV === 'production') return res.status(500).json({ error: 'Database not configured or unavailable' });
      console.error('Login: DB connect failed or error', err && err.message ? err.message : err);
      if (process.env.NODE_ENV === 'production') return res.status(500).json({ error: 'Database not configured or unavailable' });

      // dev fallback: try server/data/users.json with plain-text password (dev only)
      try {
        const usersPath = path.join(__dirname, '..', 'data', 'users.json');
        if (fs.existsSync(usersPath)) {
          const arr = JSON.parse(fs.readFileSync(usersPath, 'utf8')) || [];
          const user = arr.find(u => u.email === email);
          if (!user) return res.status(404).json({ error: 'User not found' });
          // in dev fallback password stored as plain text
          if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
          
          const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
        }
      } catch (e) {
        console.error('Login dev fallback error', e && e.stack ? e.stack : e);
      }
      return res.status(500).json({ error: 'Could not complete login' });
    }
  } catch (err) {
    console.error('Login error', err && err.stack ? err.stack : err);
  }
});

// ============ ADMIN REGISTER/LOGIN ROUTES ============

// Admin Register
router.post('/admin/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password, and name required' });
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') return res.status(400).json({ error: 'invalid input' });
    if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

    const db = await connect();
    
    // Check in admins collection
    const existing = await db.collection('admins').findOne({ email });
    if (existing) return res.status(409).json({ error: 'Admin with this email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.collection('admins').insertOne({
      email,
      password: hash,
      name,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const adminId = result.insertedId;
    const admin = await db.collection('admins').findOne({ _id: adminId });
    const token = jwt.sign({ sub: String(admin._id), email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      user: { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role },
      token
    });
  } catch (err) {
    console.error('Admin register error:', err);
    return res.status(500).json({ error: 'Failed to register admin' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.debug('POST /api/auth/admin/login request for', { email });
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const db = await connect();
    const admin = await db.collection('admins').findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ sub: String(admin._id), email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
    console.debug('Admin login successful for', { email, role: admin.role });
    
    return res.json({
      user: { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role },
      token
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// ============ DBA REGISTER/LOGIN ROUTES ============

// DBA Register
router.post('/dba/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password, and name required' });
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') return res.status(400).json({ error: 'invalid input' });
    if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

    const db = await connect();
    
    // Check in dbas collection
    const existing = await db.collection('dbas').findOne({ email });
    if (existing) return res.status(409).json({ error: 'DBA with this email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.collection('dbas').insertOne({
      email,
      password: hash,
      name,
      role: 'dba',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const dbaId = result.insertedId;
    const dba = await db.collection('dbas').findOne({ _id: dbaId });
    const token = jwt.sign({ sub: String(dba._id), email: dba.email, role: dba.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      user: { id: String(dba._id), email: dba.email, name: dba.name, role: dba.role },
      token
    });
  } catch (err) {
    console.error('DBA register error:', err);
    return res.status(500).json({ error: 'Failed to register DBA' });
  }
});

// DBA Login
router.post('/dba/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.debug('POST /api/auth/dba/login request for', { email });
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const db = await connect();
    const dba = await db.collection('dbas').findOne({ email });
    if (!dba) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, dba.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ sub: String(dba._id), email: dba.email, role: dba.role }, JWT_SECRET, { expiresIn: '7d' });
    console.debug('DBA login successful for', { email, role: dba.role });
    
    return res.json({
      user: { id: String(dba._id), email: dba.email, name: dba.name, role: dba.role },
      token
    });
  } catch (err) {
    console.error('DBA login error:', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'https://www.gleepack.shop';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role
      }))}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('/login?error=auth_failed');
    }
  }
);

module.exports = router;
