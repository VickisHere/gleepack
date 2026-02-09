var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var dotenv = require('dotenv');
var cors = require('cors');
var passport = require('passport');
var session = require('express-session');
var rateLimit = require('express-rate-limit');
var helmet = require('helmet');
var compression = require('compression');

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

// Security middleware - must be first
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.razorpay.com", "wss:", "ws:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Response time logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Timeout middleware (30 seconds)
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Rate limiting - increased limits to prevent blocking users
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs (increased)
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Removed strict rate limiting for auth routes - users can sign up/sign in unlimited times
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // limit each IP to 10 auth requests per windowMs
//   message: {
//     error: 'Too many authentication attempts, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Apply rate limiting - removed auth limiter
// app.use('/api/auth', authLimiter);
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173', // Development
      'http://localhost:3000', // Development alternative
      'https://www.gleepack.shop', // Production frontend
      'https://gleepack.shop', // Production frontend without www
      process.env.FRONTEND_URL // Environment variable
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

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

// Memory monitoring and automatic cleanup
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };

  // Log memory usage every 5 minutes
  if (Math.random() < 0.1) { // Log ~10% of the time to avoid spam
    console.log('📊 Memory Usage (MB):', memUsageMB);
  }

  // Force garbage collection if heap usage is too high (only in development)
  if (process.env.NODE_ENV !== 'production' && memUsageMB.heapUsed > 500) {
    if (global.gc) {
      console.log('🧹 Running garbage collection...');
      global.gc();
    }
  }
}, 300000); // Check every 5 minutes

// Request timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000, () => {
    console.warn(`Request timeout: ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });

  res.setTimeout(30000, () => {
    console.warn(`Response timeout: ${req.method} ${req.url}`);
  });

  next();
});
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

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));
app.use(cookieParser());

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request sanitization to prevent injection attacks
app.use((req, res, next) => {
  // Basic input sanitization
  for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  }
  for (let key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key].trim();
    }
  }
  next();
});
app.get('/favicon.png', function(req, res) {
  res.status(404).send('Not found');
});

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
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Return JSON for all requests (API is API-only, no views)
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Global error handlers for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process in production, just log it
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, just log it
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM caught, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT caught, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
