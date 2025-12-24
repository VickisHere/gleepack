var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var dotenv = require('dotenv');
var cors = require('cors');
var passport = require('passport');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var kitsRouter = require('./routes/kits');
var ordersRouter = require('./routes/orders');
var paymentsRouter = require('./routes/payments');
var productsRouter = require('./routes/products');
var profileRouter = require('./routes/profile');
var adminRouter = require('./routes/admin');
var couponsRouter = require('./routes/coupons');
var debugRouter = require('./routes/debug');
var healthRouter = require('./routes/health');
var streamRouter = require('./routes/stream');
var influencerRouter = require('./routes/influencer');
var waitingCustomersRouter = require('./routes/waiting-customers');

dotenv.config();

var app = express();

app.use(cors());

// Session configuration (required for Passport.js)
app.use(session({
  secret: process.env.JWT_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// initialize MongoDB connection (reads MONGODB_URI from environment via server/.env)
(async () => {
  try {
    const mongo = require('./lib/mongoClient');
    await mongo.connect();
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed, falling back to dev mode:', err.message || err);
    console.log('🛠️  Server will run in development mode with JSON file fallback');
  }
})();

// Passport configuration
require('./lib/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/kits', kitsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/debug', debugRouter);
app.use('/api/health', healthRouter);
app.use('/api/stream', streamRouter);
app.use('/api/influencer', influencerRouter);
app.use('/api/waiting-customers', waitingCustomersRouter);
app.use('/api/waiting-customers', waitingCustomersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // log full error on server for debugging
  console.error('Server error:', err && err.stack ? err.stack : err);
  // If this is an API request, return JSON
  if (req.path && req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }

  // render the error page for non-API requests
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
