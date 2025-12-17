const mongoose = require('mongoose');

// Define minimal Product schema for population
// This allows cart-service to populate product details without full Product model
const imageSchema = new mongoose.Schema({
  url: String,
  alt: String,
  isPrimary: Boolean
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  images: [imageSchema],
  price: Number,
  compareAtPrice: Number,
  inventory: {
    quantity: Number,
    trackInventory: Boolean,
    allowBackorder: Boolean
  },
  stock: Number
}, { strict: false });

// Register Product model if not already registered
if (!mongoose.models.Product) {
  mongoose.model('Product', productSchema);
}

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [100, 'Quantity cannot exceed 100']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for item subtotal
cartItemSchema.virtual('subtotal').get(function() {
  return this.price * this.quantity;
});

const cartSchema = new mongoose.Schema({
  // Owner (one of these must be set)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    sparse: true
  },
  sessionId: {
    type: String,
    index: true,
    sparse: true
  },

  // Cart Items
  items: [cartItemSchema],

  // Calculated Fields
  subtotal: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
  },

  // Coupon/Discount
  couponCode: {
    type: String,
    uppercase: true,
    trim: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },

  // TTL for abandoned cart cleanup (30 days)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total after discount
cartSchema.virtual('total').get(function() {
  return Math.max(0, this.subtotal - this.discount);
});

// Indexes
cartSchema.index({ userId: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save: Recalculate totals
cartSchema.pre('save', function(next) {
  this.recalculate();
  next();
});

// Method to recalculate cart totals
cartSchema.methods.recalculate = function() {
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Round to 2 decimal places
  this.subtotal = Math.round(this.subtotal * 100) / 100;
};

// Alias for calculateTotals (for controller compatibility)
cartSchema.methods.calculateTotals = cartSchema.methods.recalculate;

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity, price) {
  const existingItem = this.items.find(
    item => item.productId.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // Update to latest price
  } else {
    this.items.push({
      productId,
      quantity,
      price
    });
  }

  this.recalculate();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.productId.toString() === productId.toString()
  );

  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    return this.removeItem(productId);
  }

  item.quantity = quantity;
  this.recalculate();
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  this.recalculate();
  return this.save();
};

// Method to clear cart
cartSchema.methods.clear = async function() {
  this.items = [];
  this.couponCode = undefined;
  this.discount = 0;
  this.recalculate();
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = async function(code, discountAmount) {
  this.couponCode = code;
  this.discount = Math.min(discountAmount, this.subtotal);
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = async function() {
  this.couponCode = undefined;
  this.discount = 0;
  return this.save();
};

// Method to merge guest cart into user cart
cartSchema.methods.mergeWith = async function(guestCart) {
  for (const guestItem of guestCart.items) {
    const existingItem = this.items.find(
      item => item.productId.toString() === guestItem.productId.toString()
    );

    if (existingItem) {
      // Take the higher quantity
      existingItem.quantity = Math.max(existingItem.quantity, guestItem.quantity);
      existingItem.price = guestItem.price; // Use latest price
    } else {
      this.items.push({
        productId: guestItem.productId,
        quantity: guestItem.quantity,
        price: guestItem.price
      });
    }
  }

  this.recalculate();
  return this.save();
};

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = async function(userId) {
  let cart = await this.findOne({ userId });
  
  if (!cart) {
    cart = await this.create({ userId, items: [] });
  }
  
  return cart;
};

// Static method to find or create cart for session (guest)
cartSchema.statics.findOrCreateForSession = async function(sessionId) {
  let cart = await this.findOne({ sessionId });
  
  if (!cart) {
    cart = await this.create({ sessionId, items: [] });
  }
  
  return cart;
};

// Static method to get cart with populated products
cartSchema.statics.getPopulated = async function(query) {
  return this.findOne(query).populate({
    path: 'items.productId',
    select: 'name slug price images inventory.quantity status',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
