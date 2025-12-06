/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const { authenticate, authorize, validateBody } = require('../../../../shared/middleware');
const { orderSchemas } = require('../../../../shared/schemas');

// =============================================================================
// CUSTOMER ROUTES (Authenticated)
// =============================================================================

// Create new order (checkout)
router.post(
  '/',
  authenticate,
  validateBody(orderSchemas.create),
  orderController.createOrder
);

// Get user's orders
router.get('/', authenticate, orderController.getMyOrders);

// Get order by ID
router.get('/:orderId', authenticate, orderController.getOrderById);

// Get order by number
router.get('/number/:orderNumber', authenticate, orderController.getOrderByNumber);

// Cancel order
router.patch(
  '/:orderId/cancel',
  authenticate,
  orderController.cancelOrder
);

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Get all orders (admin)
router.get(
  '/admin/all',
  authenticate,
  authorize('admin'),
  orderController.getAllOrders
);

// Update order status (admin)
router.patch(
  '/:orderId/status',
  authenticate,
  authorize('admin'),
  validateBody(orderSchemas.updateStatus),
  orderController.updateOrderStatus
);

// Get order statistics (admin)
router.get(
  '/admin/stats',
  authenticate,
  authorize('admin'),
  orderController.getOrderStats
);

// Process refund (admin)
router.post(
  '/:orderId/refund',
  authenticate,
  authorize('admin'),
  orderController.processRefund
);

module.exports = router;
