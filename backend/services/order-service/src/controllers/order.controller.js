/**
 * Order Controller
 * Handles order lifecycle management
 */

const mongoose = require('mongoose');
const Order = require('../../../../shared/models/Order');
const { 
  AppError, 
  asyncHandler, 
  sendResponse,
  generateOrderNumber 
} = require('../../../../shared/utils');
const cartService = require('../services/cart.service');
const paymentService = require('../services/payment.service');
const notificationService = require('../services/notification.service');

/**
 * Create order from cart
 * POST /api/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

  // Get cart from Cart Service
  const cart = await cartService.getCart(userId);

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const discount = cart.discount || 0;
  const total = subtotal + shippingCost + taxAmount - discount;

  // Generate unique order number
  const orderNumber = generateOrderNumber();

  // Create order
  const order = await Order.create({
    orderNumber,
    user: userId,
    items: cart.items.map(item => ({
      product: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      variant: item.variant || {}
    })),
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    pricing: {
      subtotal,
      shipping: shippingCost,
      tax: taxAmount,
      discount,
      total
    },
    notes,
    statusHistory: [{
      status: 'pending',
      timestamp: new Date(),
      note: 'Order created'
    }]
  });

  // If payment method is card, create payment intent
  let paymentIntent = null;
  if (paymentMethod === 'card') {
    paymentIntent = await paymentService.createPaymentIntent({
      amount: total,
      orderId: order._id.toString(),
      userId,
      metadata: {
        orderNumber
      }
    });

    // Update order with payment intent ID
    order.payment = {
      method: 'card',
      status: 'pending',
      transactionId: paymentIntent.id
    };
    await order.save();
  }

  // Clear cart after order creation
  await cartService.clearCart(userId);

  // Send order confirmation notification
  await notificationService.sendOrderConfirmation(order, req.user.email);

  sendResponse(res, 201, 'Order created successfully', {
    order,
    paymentIntent: paymentIntent ? {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    } : null
  });
});

/**
 * Get user's orders
 * GET /api/orders/my-orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(query);

  sendResponse(res, 200, 'Orders retrieved successfully', {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId).lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns the order or is admin
  if (order.user.toString() !== userId && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  sendResponse(res, 200, 'Order retrieved successfully', order);
});

/**
 * Get order by order number
 * GET /api/orders/number/:orderNumber
 */
const getOrderByNumber = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const userId = req.user.id;

  const order = await Order.findOne({ orderNumber }).lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns the order or is admin
  if (order.user.toString() !== userId && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  sendResponse(res, 200, 'Order retrieved successfully', order);
});

/**
 * Cancel order
 * PATCH /api/orders/:orderId/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns the order
  if (order.user.toString() !== userId) {
    throw new AppError('Not authorized to cancel this order', 403);
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AppError(`Order cannot be cancelled. Current status: ${order.status}`, 400);
  }

  // If payment was made, process refund
  if (order.payment?.status === 'completed' && order.payment?.transactionId) {
    await paymentService.refundPayment(order.payment.transactionId, order.pricing.total);
    order.payment.status = 'refunded';
    order.payment.refundedAt = new Date();
  }

  // Update order status
  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: 'Order cancelled by customer'
  });

  await order.save();

  // Send cancellation notification
  await notificationService.sendOrderCancellation(order, req.user.email);

  sendResponse(res, 200, 'Order cancelled successfully', order);
});

/**
 * Get all orders (admin)
 * GET /api/orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    startDate, 
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const orders = await Order.find(query)
    .populate('user', 'firstName lastName email')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(query);

  sendResponse(res, 200, 'Orders retrieved successfully', {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Update order status (admin)
 * PATCH /api/orders/:orderId/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, note, trackingNumber, carrier } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Validate status transition
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['returned'],
    cancelled: [],
    returned: []
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new AppError(`Invalid status transition from ${order.status} to ${status}`, 400);
  }

  // Update order
  order.status = status;
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated to ${status}`
  });

  // Add shipping info if provided
  if (status === 'shipped' && (trackingNumber || carrier)) {
    order.shipping = {
      ...order.shipping,
      trackingNumber,
      carrier,
      shippedAt: new Date()
    };
  }

  if (status === 'delivered') {
    order.shipping = {
      ...order.shipping,
      deliveredAt: new Date()
    };
  }

  await order.save();

  // Send status update notification
  const user = await mongoose.model('User').findById(order.user).select('email');
  if (user) {
    await notificationService.sendOrderStatusUpdate(order, user.email);
  }

  sendResponse(res, 200, 'Order status updated successfully', order);
});

/**
 * Get order statistics (admin)
 * GET /api/orders/admin/stats
 */
const getOrderStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // Calculate date range
  const periodDays = parseInt(period) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Aggregate statistics
  const stats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  // Daily orders for chart
  const dailyOrders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  sendResponse(res, 200, 'Order statistics retrieved successfully', {
    summary: stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0
    },
    dailyOrders,
    ordersByStatus
  });
});

/**
 * Process refund (admin)
 * POST /api/orders/:orderId/refund
 */
const processRefund = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { amount, reason } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (!order.payment?.transactionId) {
    throw new AppError('No payment transaction found for this order', 400);
  }

  if (order.payment.status === 'refunded') {
    throw new AppError('Order has already been refunded', 400);
  }

  // Process refund through Stripe
  const refundAmount = amount || order.pricing.total;
  const refund = await paymentService.refundPayment(
    order.payment.transactionId, 
    refundAmount,
    reason
  );

  // Update order
  order.payment.status = amount === order.pricing.total ? 'refunded' : 'partially_refunded';
  order.payment.refundId = refund.id;
  order.payment.refundedAmount = refundAmount;
  order.payment.refundedAt = new Date();

  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    note: `Refund processed: $${refundAmount.toFixed(2)}. Reason: ${reason || 'Not specified'}`
  });

  await order.save();

  // Send refund notification
  const user = await mongoose.model('User').findById(order.user).select('email');
  if (user) {
    await notificationService.sendRefundNotification(order, user.email, refundAmount);
  }

  sendResponse(res, 200, 'Refund processed successfully', {
    order,
    refund: {
      id: refund.id,
      amount: refundAmount,
      status: refund.status
    }
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderByNumber,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  processRefund
};
