/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../../../../shared/middleware');

// All analytics routes require admin access
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard metrics
router.get('/metrics', analyticsController.getDashboardMetrics);

// Sales analytics with chart data
router.get('/sales', analyticsController.getSalesAnalytics);

// Top selling products
router.get('/top-products', analyticsController.getTopProducts);

// Recent orders feed
router.get('/recent-orders', analyticsController.getRecentOrders);

// Low stock alerts
router.get('/low-stock', analyticsController.getLowStockProducts);

module.exports = router;
