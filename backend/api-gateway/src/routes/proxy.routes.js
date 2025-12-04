/**
 * Proxy Routes Configuration
 * Routes requests to appropriate microservices
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

// =============================================================================
// PROXY OPTIONS FACTORY
// =============================================================================

function createProxyOptions(targetUrl, pathRewrite = {}) {
  return {
    target: targetUrl,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      // Forward request ID
      if (req.id) {
        proxyReq.setHeader('x-request-id', req.id);
      }
      
      // Forward original IP
      proxyReq.setHeader('x-forwarded-for', req.ip);
      
      // Forward authorization header
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }

      // Handle body for non-GET requests
      if (req.body && Object.keys(req.body).length > 0 && req.method !== 'GET') {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add service header for debugging
      proxyRes.headers['x-served-by'] = 'api-gateway';
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: 'Service temporarily unavailable',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    },
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'silent'
  };
}

// =============================================================================
// USER SERVICE ROUTES
// =============================================================================

// Auth routes
router.use('/auth', createProxyMiddleware(
  createProxyOptions(USER_SERVICE_URL, {
    '^/auth': '/api/auth'
  })
));

// User routes
router.use('/users', createProxyMiddleware(
  createProxyOptions(USER_SERVICE_URL, {
    '^/users': '/api/users'
  })
));

// =============================================================================
// PRODUCT SERVICE ROUTES
// =============================================================================

// Product routes
router.use('/products', createProxyMiddleware(
  createProxyOptions(PRODUCT_SERVICE_URL, {
    '^/products': '/api/products'
  })
));

// Category routes
router.use('/categories', createProxyMiddleware(
  createProxyOptions(PRODUCT_SERVICE_URL, {
    '^/categories': '/api/categories'
  })
));

// =============================================================================
// CART SERVICE ROUTES
// =============================================================================

// Cart routes
router.use('/cart', createProxyMiddleware(
  createProxyOptions(CART_SERVICE_URL, {
    '^/cart': '/api/cart'
  })
));

// =============================================================================
// ORDER SERVICE ROUTES
// =============================================================================

// Order routes
router.use('/orders', createProxyMiddleware(
  createProxyOptions(ORDER_SERVICE_URL, {
    '^/orders': '/api/orders'
  })
));

// Payment routes - special handling for webhook
router.use('/payments/webhook', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/payments': '/api/payments'
  },
  // Don't parse body for webhooks
  onProxyReq: (proxyReq, req, res) => {
    if (req.id) {
      proxyReq.setHeader('x-request-id', req.id);
    }
  }
}));

// Other payment routes
router.use('/payments', createProxyMiddleware(
  createProxyOptions(ORDER_SERVICE_URL, {
    '^/payments': '/api/payments'
  })
));

module.exports = router;
