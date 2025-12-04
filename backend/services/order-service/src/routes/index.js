/**
 * Order Service Routes Index
 */

const express = require('express');
const router = express.Router();

const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'order-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount routes
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
