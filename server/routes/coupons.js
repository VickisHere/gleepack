const express = require('express');
const router = express.Router();
const { connect } = require('../lib/mongoClient');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

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

// Get user's assigned coupons
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const db = await connect();
    const userId = req.user.sub;

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
      { $unwind: '$coupon' },
      {
        $project: {
          _id: 1,
          code: '$coupon.code',
          name: '$coupon.name',
          type: '$coupon.type',
          value: { $ifNull: ['$customValue', '$coupon.value'] },
          minOrderValue: '$coupon.minOrderValue',
          maxDiscount: '$coupon.maxDiscount',
          expiryDate: '$coupon.expiryDate',
          perUserLimit: '$coupon.perUserLimit',
          usageCount: 1,
          isActive: '$coupon.isActive'
        }
      }
    ]).toArray();

    // Filter out expired or inactive
    const now = new Date();
    const validCoupons = assignedCoupons.filter(c =>
      c.isActive &&
      c.expiryDate > now &&
      c.usageCount < c.perUserLimit
    );

    return res.json(validCoupons);
  } catch (err) {
    console.error('Error fetching user coupons:', err);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Validate and apply coupon
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    if (!code || !orderValue) {
      return res.status(400).json({ error: 'code and orderValue required' });
    }

    const db = await connect();
    const userId = req.user.sub;

    // Find coupon
    const coupon = await db.collection('coupons').findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    // Check if active
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is inactive' });
    }

    // Check dates
    const now = new Date();
    if (now < coupon.startDate || now > coupon.expiryDate) {
      return res.status(400).json({ error: 'Coupon is expired or not yet valid' });
    }

    // Check total usage
    if (coupon.totalUsageLimit && coupon.usageCount >= coupon.totalUsageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit exceeded' });
    }

    // Check min order value
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      return res.status(400).json({ error: 'Order value does not meet minimum requirement' });
    }

    // Check user assignment (skip for influencer coupons)
    if (!coupon.isInfluencerCoupon) {
      const assigned = await db.collection('user_coupons').findOne({
        couponId: coupon._id,
        userId: new ObjectId(userId)
      });
      if (!assigned) {
        return res.status(403).json({ error: 'You are not eligible for this coupon' });
      }

      // Check per user limit
      if (assigned.usageCount >= coupon.perUserLimit) {
        return res.status(400).json({ error: 'You have exceeded the usage limit for this coupon' });
      }

      // Calculate discount
      let discount = 0;
      const value = assigned.customValue || coupon.value;
      if (coupon.type === 'flat') {
        discount = value;
      } else if (coupon.type === 'percentage') {
        discount = (orderValue * value) / 100;
      }

      // Apply max discount
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }

      // Ensure discount doesn't exceed order value
      if (discount > orderValue) {
        discount = orderValue;
      }

      return res.json({
        valid: true,
        discount: discount,
        finalAmount: orderValue - discount,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: value
        }
      });
    } else {
      // For influencer coupons, check per user limit via usage tracking
      // Since influencer coupons are public, we need to track per user usage differently
      // For now, allow unlimited per user for influencer coupons
      // TODO: Implement per user tracking for influencer coupons if needed

      // Calculate discount
      let discount = 0;
      if (coupon.type === 'flat') {
        discount = coupon.value;
      } else if (coupon.type === 'percentage') {
        discount = (orderValue * coupon.value) / 100;
      }

      // Apply max discount
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }

      // Ensure discount doesn't exceed order value
      if (discount > orderValue) {
        discount = orderValue;
      }

      return res.json({
        valid: true,
        discount: discount,
        finalAmount: orderValue - discount,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value
        }
      });
    }
  } catch (err) {
    console.error('Error validating coupon:', err);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Apply coupon (update usage)
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { code, orderId } = req.body;
    if (!code || !orderId) {
      return res.status(400).json({ error: 'code and orderId required' });
    }

    const db = await connect();
    const userId = req.user.sub;

    // Find coupon
    const coupon = await db.collection('coupons').findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    if (!coupon.isInfluencerCoupon) {
      // For regular assigned coupons
      const assigned = await db.collection('user_coupons').findOne({
        couponId: coupon._id,
        userId: new ObjectId(userId)
      });
      if (!assigned) {
        return res.status(403).json({ error: 'Not assigned to this coupon' });
      }

      // Update usage
      await db.collection('coupons').updateOne(
        { _id: coupon._id },
        { $inc: { usageCount: 1, totalDiscountGiven: req.body.discount || 0 } }
      );

      await db.collection('user_coupons').updateOne(
        { _id: assigned._id },
        { $inc: { usageCount: 1 } }
      );
    } else {
      // For influencer coupons, just update total usage
      await db.collection('coupons').updateOne(
        { _id: coupon._id },
        { $inc: { usageCount: 1, totalDiscountGiven: req.body.discount || 0 } }
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error applying coupon:', err);
    return res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

module.exports = router;