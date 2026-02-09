var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const { connect } = require('../lib/mongoClient');
const { enrichAddressWithDistrict } = require('../lib/pincodeValidator');

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

// GET current user's profile
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  try {
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;
    const _id = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid user id' });
    // Try admins collection first
    let obj = await db.collection('admins').findOne({ _id });
    // Then try dbas
    if (!obj) obj = await db.collection('dbas').findOne({ _id });
    // Finally fallback to users
    if (!obj) obj = await db.collection('users').findOne({ _id });
    if (!obj) return res.status(404).json({ error: 'User not found' });

    // Normalize profile fields across collections (hide internal id)
    const profile = {
      id: obj._id,
      email: obj.email,
      name: obj.name,
      phone: obj.phone,
      addresses: obj.addresses || [],
      createdAt: obj.createdAt
    };

    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Update current user's profile (allow updating name, phone, and addresses)
router.put('/', authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { name, phone, addresses } = req.body;
  try {
    const db = await connect();
    const ObjectId = require('mongodb').ObjectId;
    const _id = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid user id' });
    
    console.log('=== Profile Update Start ===');
    console.log('Updating user:', userId);
    console.log('Name:', name);
    console.log('Phone:', phone);
    console.log('Addresses count:', addresses ? addresses.length : 0);
    
    // Enrich addresses with district info if missing (backend validation)
    // But handle enrichment gracefully - don't fail if enrichment fails
    let enrichedAddresses = addresses || [];
    if (Array.isArray(enrichedAddresses) && enrichedAddresses.length > 0) {
      enrichedAddresses = await Promise.all(
        enrichedAddresses.map(async (addr) => {
          try {
            return await enrichAddressWithDistrict(addr);
          } catch (err) {
            console.warn('Failed to enrich address, saving as-is:', err.message);
            return addr; // Return original if enrichment fails
          }
        })
      );
    }
    
    console.log('Enriched addresses:', enrichedAddresses);
    
    // Build update object - only set fields that are provided
    const update = { $set: { addresses: enrichedAddresses, updatedAt: new Date() } };
    if (name !== undefined) {
      update.$set.name = name;
    }
    if (phone !== undefined) {
      update.$set.phone = phone;
    }

    console.log('Update object:', JSON.stringify(update));

    // Attempt update in admins, then dbas, then users
    let result = await db.collection('admins').findOneAndUpdate({ _id }, update, { returnDocument: 'after' });
    console.log('Admins update result:', result ? 'Found' : 'Not found');
    
    if (!result || !result.value) {
      result = await db.collection('dbas').findOneAndUpdate({ _id }, update, { returnDocument: 'after' });
      console.log('DBAs update result:', result ? 'Found' : 'Not found');
    }
    
    if (!result || !result.value) {
      result = await db.collection('users').findOneAndUpdate({ _id }, update, { returnDocument: 'after' });
      console.log('Users update result:', result ? 'Found' : 'Not found');
    }

    console.log('Final result object:', result);
    console.log('Final result.value:', result ? result.value : 'null');

    if (!result || !result.value) {
      console.error('User not found in any collection');
      return res.status(404).json({ error: 'User not found' });
    }

    const obj = result.value;
    console.log('Profile updated successfully. Addresses count:', (obj.addresses || []).length);
    
    const profile = {
      id: obj._id,
      email: obj.email,
      name: obj.name,
      phone: obj.phone,
      addresses: obj.addresses || [],
      createdAt: obj.createdAt
    };

    console.log('=== Profile Update End ===');
    return res.json(profile);
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

module.exports = router;
module.exports = router;
