/**
 * API Gateway Application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const proxyRoutes = require('./routes/proxy.routes');
const healthRoutes = require('./routes/health.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// =============================================================================
// TRUST PROXY
// =============================================================================

// Enable trust proxy for rate limiting to work correctly behind proxies
app.set('trust proxy', 1);

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}));

// Health check (no rate limit)
app.use(healthRoutes);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // Higher limit for gateway
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// =============================================================================
// PARSING MIDDLEWARE
// =============================================================================

// Cookie parser
app.use(cookieParser());

// JSON parsing - parse body before proxy
app.use(express.json({ limit: '10mb' }));

// URL-encoded parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// LOGGING
// =============================================================================

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Request ID middleware
const { v4: uuidv4 } = require('uuid');
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check (no proxy)


// Proxy routes to microservices
app.use('/api', proxyRoutes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
