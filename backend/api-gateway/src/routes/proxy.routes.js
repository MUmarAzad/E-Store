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
      console.log(`[PROXY] ${req.method} ${req.originalUrl || req.url} -> ${targetUrl}${proxyReq.path}`);
      console.log(`[PROXY] Auth header:`, req.headers.authorization ? 'Present' : 'MISSING');
      
      // Forward request ID
      if (req.id) {
        proxyReq.setHeader('x-request-id', req.id);
      }
      
      // Forward original IP
      proxyReq.setHeader('x-forwarded-for', req.ip);
      
      // Forward authorization header
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
        console.log(`[PROXY] Forwarding auth header:`, req.headers.authorization.substring(0, 20) + '...');
      } else {
        console.log(`[PROXY] WARNING: No authorization header in request`);
      }
      
      // Fix for body forwarding - restream parsed body
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')) {
        const bodyData = JSON.stringify(req.body);
        console.log(`[PROXY] Body present (${bodyData.length} bytes)`);
        
        // Must set content-type and length before writing
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        
        // Write the body data
        proxyReq.write(bodyData);
        proxyReq.end(); // Important: end the request stream
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] Response ${proxyRes.statusCode} for ${req.method} ${req.originalUrl || req.url}`);
      console.log(`[PROXY] Response headers:`, proxyRes.headers);
      // Add service header for debugging
      proxyRes.headers['x-served-by'] = 'api-gateway';
    },
    onError: (err, req, res) => {
      console.error(`[PROXY] ❌ ERROR for ${req.method} ${req.originalUrl || req.url}:`, err.message);
      console.error(`[PROXY] Error stack:`, err.stack);
      
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
    '^/api/auth': '/api/auth',
    '^/auth': '/api/auth'
  })
));

// User routes
router.use('/users', createProxyMiddleware(
  createProxyOptions(USER_SERVICE_URL, {
    '^/api/users': '/api/users',
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

// Upload routes (Product service handles uploads)
router.use('/upload', createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/upload': '/api/upload'
  },
  timeout: 60000, // Longer timeout for uploads
  proxyTimeout: 60000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] Upload ${req.method} ${req.originalUrl} -> ${PRODUCT_SERVICE_URL}/api/upload`);
    
    // Forward request ID
    if (req.id) {
      proxyReq.setHeader('x-request-id', req.id);
    }
    
    // Forward authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    
    // Forward original IP
    proxyReq.setHeader('x-forwarded-for', req.ip);
    
    // Don't modify the body for multipart uploads - let it stream through
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[PROXY] Upload Response ${proxyRes.statusCode}`);
    proxyRes.headers['x-served-by'] = 'api-gateway';
  },
  onError: (err, req, res) => {
    console.error(`[PROXY] Upload ERROR:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: 'Upload service temporarily unavailable',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
}));

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

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Admin analytics routes (order service)
router.use('/admin/analytics', createProxyMiddleware(
  createProxyOptions(ORDER_SERVICE_URL, {
    '^/admin/analytics': '/api/admin/analytics'
  })
));

// Admin user routes
router.use('/admin/users', createProxyMiddleware(
  createProxyOptions(USER_SERVICE_URL, {
    '^/admin/users': '/api/users'
  })
));

// Admin product routes
router.use('/admin/products', createProxyMiddleware(
  createProxyOptions(PRODUCT_SERVICE_URL, {
    '^/admin/products': '/api/products'
  })
));

// Admin order routes - use custom pathRewrite function for dynamic routes
// Updated: 2025-12-14 15:20
router.use('/admin/orders', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // req.originalUrl = /api/admin/orders?... (full URL from gateway mount point)
    // req.baseUrl = /api/admin/orders
    // path = the path portion after mount point (could be empty, /, or /something)
    const fullPath = req.originalUrl || '';
    console.log('[PROXY] Admin orders - originalUrl:', fullPath, 'path:', path, 'method:', req.method);
    
    // Handle status update: /api/admin/orders/:id/status -> /api/orders/:id/status
    const statusMatch = fullPath.match(/\/api\/admin\/orders\/([^/?]+)\/status/);
    if (statusMatch) {
      const newPath = `/api/orders/${statusMatch[1]}/status`;
      console.log('[PROXY] Rewriting status update to:', newPath);
      return newPath;
    }
    
    // Handle get all orders: /api/admin/orders or /api/admin/orders?... -> /api/orders/admin/all
    if (fullPath.match(/\/api\/admin\/orders(\?|$)/)) {
      const queryString = fullPath.includes('?') ? fullPath.substring(fullPath.indexOf('?')) : '';
      const newPath = `/api/orders/admin/all${queryString}`;
      console.log('[PROXY] Rewriting list to:', newPath);
      return newPath;
    }
    
    // Default: pass through to order service (for other admin order routes)
    const newPath = fullPath.replace('/api/admin/orders', '/api/orders');
    console.log('[PROXY] Default rewriting to:', newPath);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.id) proxyReq.setHeader('x-request-id', req.id);
    if (req.headers.authorization) proxyReq.setHeader('authorization', req.headers.authorization);
    proxyReq.setHeader('x-forwarded-for', req.ip);
    
    // Fix for body forwarding
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['x-served-by'] = 'api-gateway';
  },
  onError: (err, req, res) => {
    console.error(`[PROXY] Admin Orders ERROR:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: 'Order service temporarily unavailable'
      });
    }
  }
}));

module.exports = router;
