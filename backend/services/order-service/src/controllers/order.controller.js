/**
 * Order Controller
 * Handles order lifecycle management
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const { asyncHandler } = require('../../../../shared/utils');
const { success, created, notFound, badRequest, paginated } = require('../../../../shared/utils/apiResponse');
const cartService = require('../services/cart.service');
const paymentService = require('../services/payment.service');
const notificationService = require('../services/notification.service');

// Generate unique order number (same as in Order model)
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}${month}-${random}`;
};

/**
 * Create order from cart
 * POST /api/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

  console.log('📦 Creating order for user:', userId);
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📦 Payment method:', paymentMethod);

  // Add user's name to shipping address if not provided
  if (!shippingAddress.firstName || !shippingAddress.lastName) {
    // Get user info from user service (already available in req.user)
    shippingAddress.fullName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Customer';
  } else {
    shippingAddress.fullName = `${shippingAddress.firstName} ${shippingAddress.lastName}`;
  }

  // Get token from request header
  const token = req.headers.authorization?.split(' ')[1];

  // Get cart from Cart Service
  const cart = await cartService.getCart(userId, token);

  console.log('📦 Cart from service:', JSON.stringify(cart, null, 2));
  console.log('📦 Cart items:', cart?.items);
  console.log('📦 Cart items length:', cart?.items?.length);

  if (!cart || !cart.items || cart.items.length === 0) {
    return badRequest(res, 'Cart is empty');
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const taxRate = 0.08; // 8% tax
  const taxAmount = Number((subtotal * taxRate).toFixed(2));
  const discount = Number(cart.discount) || 0;
  const total = Number((subtotal + shippingCost + taxAmount - discount).toFixed(2));

  // Generate unique order number
  const orderNumber = generateOrderNumber();

  // Create order
  const order = await Order.create({
    orderNumber,
    userId: userId,
    items: cart.items.map(item => ({
      productId: item.productId._id || item.productId,
      name: item.product?.name || item.name || 'Product',
      slug: item.product?.slug,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal || (item.price * item.quantity),
      image: item.product?.images?.[0] || item.image,
      variant: item.variant || {}
    })),
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    payment: {
      method: paymentMethod === 'cod' ? 'cod' : 'credit_card',
      status: 'pending'
    },
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
  } else if (paymentMethod === 'cod') {
    // Cash on Delivery - mark as pending
    order.payment = {
      method: 'cod',
      status: 'pending',
      transactionId: `COD-${orderNumber}`
    };
    order.status = 'confirmed'; // COD orders are automatically confirmed
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Cash on Delivery order confirmed'
    });
    await order.save();
  }

  // Clear cart after order creation
  await cartService.clearCart(userId, token);

  // Send order confirmation notification
  await notificationService.sendOrderConfirmation(order, req.user.email);

  return created(res, order);
});

/**
 * Get user's orders
 * GET /api/orders/my-orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const query = { userId: userId };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(query);

  return paginated(res, {
    data: orders,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    message: 'Orders retrieved successfully'
  });
});

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId || req.user._id;

  const order = await Order.findById(orderId).lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns the order or is admin
  if (order.userId.toString() !== userId && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  return success(res, order, 'Order retrieved successfully');
});

/**
 * Get order by order number
 * GET /api/orders/number/:orderNumber
 */
const getOrderByNumber = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const userId = req.user.userId || req.user._id;

  const order = await Order.findOne({ orderNumber }).lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns the order or is admin
  if (order.userId.toString() !== userId && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  return success(res, order, 'Order retrieved successfully');
});

/**
 * Cancel order
 * PATCH /api/orders/:orderId/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId || req.user._id;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns the order
  if (order.userId.toString() !== userId) {
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

  return success(res, order, 'Order cancelled successfully');
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

  console.log('[getAllOrders] Query params:', req.query);
  console.log('[getAllOrders] Status:', status, 'Type:', typeof status);

  const query = {};

  // Only filter by status if it's provided and not empty
  if (status && status.trim() !== '') {
    query.status = status;
    console.log('[getAllOrders] Filtering by status:', status);
  } else {
    console.log('[getAllOrders] No status filter applied');
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  console.log('[getAllOrders] Final query:', query);

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const orders = await Order.find(query)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(query);

  console.log('[getAllOrders] Found', orders.length, 'orders out of', total);

  return paginated(res, {
    data: orders,
    page: parseInt(page),
    limit: parseInt(limit),
    total
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
  const user = await mongoose.model('User').findById(order.userId).select('email');
  if (user) {
    await notificationService.sendOrderStatusUpdate(order, user.email);
  }

  return success(res, order, 'Order status updated successfully');
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

  return success(res, {
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
  const user = await mongoose.model('User').findById(order.userId).select('email');
  if (user) {
    await notificationService.sendRefundNotification(order, user.email, refundAmount);
  }

  return success(res, {
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
