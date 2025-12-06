/**
 * Payment Routes
 */

const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const { authenticate, validateBody } = require('../../../../shared/middleware');
const { orderSchemas } = require('../../../../shared/schemas');

// =============================================================================
// PAYMENT ROUTES
// =============================================================================

// Create payment intent (Stripe)
router.post(
  '/create-intent',
  authenticate,
  validateBody(orderSchemas.payment),
  paymentController.createPaymentIntent
);

// Confirm payment
router.post(
  '/confirm',
  authenticate,
  paymentController.confirmPayment
);

// Get payment status
router.get('/:orderId/status', authenticate, paymentController.getPaymentStatus);

// Get payment methods
router.get('/methods', authenticate, paymentController.getPaymentMethods);

// Stripe webhook (no auth, uses signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

module.exports = router;
