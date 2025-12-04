/**
 * Payment Controller
 * Handles Stripe payment processing
 */

const Order = require('../../../../shared/models/Order');
const { AppError, asyncHandler, sendResponse } = require('../../../../shared/utils');
const paymentService = require('../services/payment.service');
const notificationService = require('../services/notification.service');

/**
 * Create payment intent
 * POST /api/payments/create-intent
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body;
  const userId = req.user.id;

  // Validate order exists and belongs to user
  if (orderId) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user.toString() !== userId) {
      throw new AppError('Not authorized', 403);
    }

    if (order.payment?.status === 'completed') {
      throw new AppError('Order has already been paid', 400);
    }
  }

  const paymentIntent = await paymentService.createPaymentIntent({
    amount: amount || order.pricing.total,
    orderId,
    userId,
    metadata: {
      orderNumber: orderId ? order.orderNumber : undefined
    }
  });

  sendResponse(res, 200, 'Payment intent created', {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  });
});

/**
 * Confirm payment
 * POST /api/payments/confirm/:paymentIntentId
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.params;
  const userId = req.user.id;

  // Retrieve payment intent to verify
  const paymentIntent = await paymentService.retrievePaymentIntent(paymentIntentId);

  if (!paymentIntent) {
    throw new AppError('Payment not found', 404);
  }

  // Verify the payment belongs to the user
  if (paymentIntent.metadata.userId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  // Update order if orderId is in metadata
  if (paymentIntent.metadata.orderId) {
    const order = await Order.findById(paymentIntent.metadata.orderId);
    
    if (order && paymentIntent.status === 'succeeded') {
      order.payment = {
        method: 'card',
        status: 'completed',
        transactionId: paymentIntentId,
        paidAt: new Date()
      };
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Payment received'
      });
      await order.save();
    }
  }

  sendResponse(res, 200, 'Payment confirmed', {
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100
  });
});

/**
 * Get payment status
 * GET /api/payments/status/:paymentIntentId
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.params;
  const userId = req.user.id;

  const paymentIntent = await paymentService.retrievePaymentIntent(paymentIntentId);

  if (!paymentIntent) {
    throw new AppError('Payment not found', 404);
  }

  // Verify the payment belongs to the user
  if (paymentIntent.metadata.userId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  sendResponse(res, 200, 'Payment status retrieved', {
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    created: new Date(paymentIntent.created * 1000)
  });
});

/**
 * Get payment methods
 * GET /api/payments/methods
 */
const getPaymentMethods = asyncHandler(async (req, res) => {
  // Return available payment methods
  const methods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      enabled: true
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      enabled: true
    }
  ];

  sendResponse(res, 200, 'Payment methods retrieved', methods);
});

/**
 * Handle Stripe webhook
 * POST /api/payments/webhook
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = paymentService.verifyWebhookSignature(req.body, sig);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    throw new AppError(`Webhook Error: ${err.message}`, 400);
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;

    case 'charge.dispute.created':
      await handleDispute(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt
  res.json({ received: true });
});

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  const order = await Order.findById(orderId);
  if (!order) {
    console.error('Order not found for payment:', orderId);
    return;
  }

  // Update order status
  order.payment = {
    method: 'card',
    status: 'completed',
    transactionId: paymentIntent.id,
    paidAt: new Date()
  };
  order.status = 'confirmed';
  order.statusHistory.push({
    status: 'confirmed',
    timestamp: new Date(),
    note: 'Payment received via Stripe'
  });

  await order.save();

  // Send confirmation email
  const mongoose = require('mongoose');
  const user = await mongoose.model('User').findById(order.user).select('email');
  if (user) {
    await notificationService.sendPaymentConfirmation(order, user.email);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  const order = await Order.findById(orderId);
  if (!order) return;

  order.payment = {
    ...order.payment,
    status: 'failed',
    failureReason: paymentIntent.last_payment_error?.message
  };
  order.statusHistory.push({
    status: 'pending',
    timestamp: new Date(),
    note: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
  });

  await order.save();

  // Notify user
  const mongoose = require('mongoose');
  const user = await mongoose.model('User').findById(order.user).select('email');
  if (user) {
    await notificationService.sendPaymentFailed(order, user.email);
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
  console.log('Refund processed:', charge.id);

  if (!charge.payment_intent) return;

  const order = await Order.findOne({
    'payment.transactionId': charge.payment_intent
  });

  if (!order) return;

  const refundedAmount = charge.amount_refunded / 100;
  
  order.payment.status = refundedAmount >= order.pricing.total ? 'refunded' : 'partially_refunded';
  order.payment.refundedAmount = refundedAmount;
  order.payment.refundedAt = new Date();

  await order.save();
}

/**
 * Handle dispute
 */
async function handleDispute(dispute) {
  console.log('Dispute created:', dispute.id);

  if (!dispute.payment_intent) return;

  const order = await Order.findOne({
    'payment.transactionId': dispute.payment_intent
  });

  if (!order) return;

  order.payment.disputeId = dispute.id;
  order.payment.disputeStatus = 'pending';
  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    note: `Payment dispute opened: ${dispute.reason}`
  });

  await order.save();

  // TODO: Notify admin about dispute
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getPaymentMethods,
  handleWebhook
};
