/**
 * Cart Service - Express Application
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
const cartRoutes = require('./routes/cart.routes');

const app = express();
const logger = createLogger('cart-service');

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

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cart Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for cart operations
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// =============================================================================
// ROUTES
// =============================================================================



// API routes
app.use('/api/cart', cartRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
