var express = require('express');
var router = express.Router();
const { connect } = require('../lib/mongoClient');
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

function influencerMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role?.toLowerCase() !== 'influencer' && req.user.role?.toLowerCase() !== 'admin') return res.status(403).json({ error: 'Influencer or Admin access required' });
  next();
}

// Get influencer's own dashboard
router.get('/dashboard', authMiddleware, influencerMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;

    let userId = req.user.sub;
    if (req.user.role === 'admin' && req.query.userId) {
      userId = req.query.userId;
    }

    // Find influencer by user ID
    const influencer = await db.collection('influencers').findOne({ userId: new ObjectId(userId) });
    if (!influencer) {
      // If no influencer profile found, return default data
      return res.json({
        user: {
          email: req.user.email,
          name: req.user.name || 'N/A',
          role: req.user.role
        },
        coupons: [],
        commissionRevenue: 0,
        couponOrders: {
          count: 0,
          orders: []
        },
        stats: {
          totalOrders: 0,
          totalCommissionEarned: 0,
          todayCommission: 0,
          thisMonthCommission: 0
        },
        orders: [],
        showOrderAmount: false
      });
    }

    // Find all coupons for this influencer
    // For admins, show all coupons (active and inactive) for management
    // For influencers, only show active coupons
    const isAdminRequest = req.user.role === 'admin';
    const couponFilter = isAdminRequest 
        ? { influencerId: influencer._id } 
        : { influencerId: influencer._id, isActive: true };
    const coupons = await db.collection('coupons').find(couponFilter).toArray();

    // Find orders using any of these coupons (all orders, not just completed)
    const couponCodes = coupons.map(c => c.code);
    const allOrders = await db.collection('orders').find({
      'coupon.code': { $in: couponCodes }
    }).sort({ createdAt: -1 }).limit(50).toArray();

    // Filter for completed orders only for stats (case-insensitive status check)
    const orders = allOrders.filter(order => 
      (order.status || '').toLowerCase() === 'delivered' && 
      (order.paymentStatus || '').toLowerCase() === 'paid'
    );

    // Calculate stats
    const totalOrders = orders.length;
    const totalCommissionEarned = orders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0);

    // Today and this month commissions
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
    const thisMonthOrders = orders.filter(order => new Date(order.createdAt) >= thisMonth);

    const todayCommission = todayOrders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0);
    const thisMonthCommission = thisMonthOrders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0);

    // Get user info
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

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
      orders: allOrders.map(order => ({
        _id: order._id,
        total: influencer.showOrderAmount ? order.total : null,
        createdAt: order.createdAt,
        status: order.status,
        couponCode: order.coupon?.code,
        commissionAmount: order.commissionAmount,
        paymentStatus: order.paymentStatus
      })),
      showOrderAmount: influencer.showOrderAmount
    });
  } catch (err) {
    console.error('Error fetching influencer dashboard:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

module.exports = router;