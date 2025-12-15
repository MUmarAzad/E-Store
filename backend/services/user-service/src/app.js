/**
 * User Service - Express Application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { corsOptions } = require('../../../config/cors');
const { errorHandler } = require('../../../shared/middleware');
const { createLogger } = require('../../../shared/utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const logger = createLogger('user-service');

// Enable trust proxy for rate limiting
app.set('trust proxy', 1);

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check - BEFORE rate limiting
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================================================
// ROUTES
// =============================================================================

// Debug middleware to log all requests - BEFORE routes
app.use((req, res, next) => {
  console.log(`[USER-SERVICE] ${req.method} ${req.originalUrl || req.path}`);
  console.log(`[USER-SERVICE] Headers:`, Object.keys(req.headers));
  console.log(`[USER-SERVICE] Content-Type:`, req.headers['content-type']);
  console.log(`[USER-SERVICE] Content-Length:`, req.headers['content-length']);
  next();
});



// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', userRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`[USER-SERVICE] 404 - ${req.method} ${req.originalUrl} not found`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
