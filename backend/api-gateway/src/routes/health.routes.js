/**
 * Health Check Routes
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Service URLs
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3000',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003'
};

/**
 * Gateway health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Check all services health
 */
router.get('/health/all', async (req, res) => {
  const healthChecks = {};

  // Check each service
  await Promise.all(
    Object.entries(services).map(async ([name, url]) => {
      try {
        const response = await axios.get(`${url}/api/health`, {
          timeout: 5000
        });
        healthChecks[name] = {
          status: 'healthy',
          uptime: response.data.uptime
        };
      } catch (error) {
        healthChecks[name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    })
  );

  // Determine overall health
  const allHealthy = Object.values(healthChecks).every(
    check => check.status === 'healthy'
  );

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    gateway: {
      status: 'healthy',
      uptime: process.uptime()
    },
    services: healthChecks,
    timestamp: new Date().toISOString()
  });
});

/**
 * Ready check (for Kubernetes/Docker)
 */
router.get('/ready', (req, res) => {
  res.json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * Live check (for Kubernetes/Docker)
 */
router.get('/live', (req, res) => {
  res.json({
    live: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
