const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { connect } = require('./mongoClient');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_env';

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://gleepackcompb.vercel.app/api/auth/google/callback'
    },
    async function(accessToken, refreshToken, profile, done) {
      try {
        const db = await connect();
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Check if user exists
        let user = await db.collection('users').findOne({ email });

        if (user) {
          // User exists, return user
          return done(null, user);
        } else {
          // Create new user
          const result = await db.collection('users').insertOne({
            email,
            name,
            role: 'customer',
            googleId: profile.id,
            createdAt: new Date()
          });
          user = await db.collection('users').findOne({ _id: result.insertedId });

          // Assign welcome coupon
          try {
            const welcomeCoupon = await db.collection('coupons').findOne({ code: 'WELCOME' });
            if (welcomeCoupon) {
              await db.collection('user_coupons').insertOne({
                couponId: welcomeCoupon._id,
                userId: result.insertedId,
                usageCount: 0,
                assignedAt: new Date()
              });
            }
          } catch (e) {
            console.warn('Failed to assign welcome coupon', e);
          }

          return done(null, user);
        }
      } catch (err) {
        console.error('Google auth error:', err);
        return done(err, null);
      }
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(async function(id, done) {
    try {
      const db = await connect();
      const user = await db.collection('users').findOne({ _id: id });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};