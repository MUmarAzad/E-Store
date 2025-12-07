const mongoose = require('mongoose');

// Generate unique order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}${month}-${random}`;
};

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Snapshot of product at order time (denormalized)
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String
  },
  image: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const addressSchema = new mongoose.Schema({
  fullName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Pakistan' },
  phone: { type: String }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'cod', 'bank_transfer'],
    required: true
  },
  transactionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  cardLast4: {
    type: String
  },
  cardBrand: {
    type: String
  }
}, { _id: false });

const pricingSchema = new mongoose.Schema({
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const shippingSchema = new mongoose.Schema({
  method: {
    type: String,
    default: 'standard'
  },
  carrier: {
    type: String
  },
  trackingNumber: {
    type: String
  },
  estimatedDelivery: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const orderSchema = new mongoose.Schema({
  // Order Identifier
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: generateOrderNumber
  },

  // Customer Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Order Items
  items: [orderItemSchema],

  // Addresses
  shippingAddress: {
    type: addressSchema,
    required: true
  },
  billingAddress: {
    type: addressSchema,
    required: true
  },

  // Payment
  payment: {
    type: paymentSchema,
    required: true
  },

  // Pricing
  pricing: {
    type: pricingSchema,
    required: true
  },

  // Shipping
  shipping: {
    type: shippingSchema,
    default: () => ({})
  },

  // Order Status
  status: {
    type: String,
    enum: [
      'pending',      // Order placed, awaiting payment
      'confirmed',    // Payment confirmed
      'processing',   // Being prepared
      'shipped',      // Dispatched
      'delivered',    // Delivered to customer
      'cancelled',    // Cancelled
      'refunded'      // Refunded
    ],
    default: 'pending',
    index: true
  },

  // Status History (Audit Trail)
  statusHistory: [statusHistorySchema],

  // Notes
  customerNote: {
    type: String,
    maxlength: 500
  },
  adminNote: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for customer full name
orderSchema.virtual('customerName').get(function() {
  return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

// Pre-save: Add initial status to history
orderSchema.pre('save', function(next) {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  next();
});

// Method to update status
orderSchema.methods.updateStatus = async function(newStatus, note = '', updatedBy = null) {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: []
  };

  const allowedStatuses = validTransitions[this.status];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });

  // Update shipping dates
  if (newStatus === 'shipped') {
    this.shipping.shippedAt = new Date();
  } else if (newStatus === 'delivered') {
    this.shipping.deliveredAt = new Date();
  }

  // Update payment status
  if (newStatus === 'confirmed') {
    this.payment.status = 'completed';
    this.payment.paidAt = new Date();
  } else if (newStatus === 'refunded') {
    this.payment.status = 'refunded';
  }

  return this.save();
};

// Method to cancel order
orderSchema.methods.cancel = async function(reason = '', updatedBy = null) {
  if (!['pending', 'confirmed', 'processing'].includes(this.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  return this.updateStatus('cancelled', reason, updatedBy);
};

// Static method to get user orders
orderSchema.statics.getUserOrders = async function(userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  
  const filter = { userId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    this.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(filter)
  ]);

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method for analytics
orderSchema.statics.getAnalytics = async function(startDate, endDate) {
  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelled'] }
  };

  const [salesByDay, totals, topProducts, statusBreakdown] = await Promise.all([
    // Sales by day
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),

    // Overall totals
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]),

    // Top products
    this.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]),

    // Status breakdown
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    salesByDay,
    totals: totals[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
    topProducts,
    statusBreakdown
  };
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
