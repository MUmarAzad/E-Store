/**
 * Cart Controller
 * Handles cart operations with real-time updates
 */

const Cart = require('../models/Cart');
const productService = require('../services/product.service');
const socketService = require('../socket');
const { asyncHandler } = require('../../../../shared/utils');
const {
  success,
  created,
  notFound,
  badRequest,
} = require('../../../../shared/utils/apiResponse');

/**
 * Get cart identifier (userId or sessionId)
 */
const getCartIdentifier = (req) => {
  if (req.user) {
    return { user: req.user._id };
  }
  if (req.sessionId) {
    return { sessionId: req.sessionId };
  }
  return null;
};

/**
 * @desc    Get cart
 * @route   GET /api/cart
 * @access  Public (with session) / Private
 */
const getCart = asyncHandler(async (req, res) => {
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return success(res, { cart: { items: [], totals: { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 } } });
  }

  let cart = await Cart.findOne(identifier);

  if (!cart) {
    // Create empty cart
    cart = await Cart.create({
      ...identifier,
      items: [],
      status: 'active',
    });
  }

  // Populate product details
  await cart.populate('items.product', 'name slug images pricing inventory');

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  return success(res, { cart });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Public (with session) / Private
 */
const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  // Verify product exists and is in stock
  const product = await productService.getProduct(productId);
  if (!product) {
    return notFound(res, 'Product not found');
  }

  if (!product.inventory.inStock || product.inventory.quantity < quantity) {
    return badRequest(res, 'Product is out of stock or insufficient quantity');
  }

  // Find or create cart
  let cart = await Cart.findOne(identifier);
  if (!cart) {
    cart = await Cart.create({
      ...identifier,
      items: [],
      status: 'active',
    });
  }

  // Check if item already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Check stock
    if (newQuantity > product.inventory.quantity) {
      return badRequest(res, `Only ${product.inventory.quantity} items available`);
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.pricing.salePrice || product.pricing.price;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      price: product.pricing.salePrice || product.pricing.price,
      variant,
    });
  }

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  // Populate for response
  await cart.populate('items.product', 'name slug images pricing inventory');

  // Emit real-time update
  if (req.user) {
    socketService.emitCartUpdate(req.user._id.toString(), cart);
  } else if (req.sessionId) {
    socketService.emitGuestCartUpdate(req.sessionId, cart);
  }

  return success(res, { cart }, 'Item added to cart');
});

/**
 * @desc    Update item quantity
 * @route   PATCH /api/cart/items/:itemId
 * @access  Public (with session) / Private
 */
const updateItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart) {
    return notFound(res, 'Cart not found');
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return notFound(res, 'Item not found in cart');
  }

  // Verify stock
  const product = await productService.getProduct(item.product.toString());
  if (!product) {
    return notFound(res, 'Product no longer available');
  }

  if (quantity > product.inventory.quantity) {
    return badRequest(res, `Only ${product.inventory.quantity} items available`);
  }

  // Update quantity
  item.quantity = quantity;
  item.price = product.pricing.salePrice || product.pricing.price;

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  // Populate for response
  await cart.populate('items.product', 'name slug images pricing inventory');

  // Emit real-time update
  if (req.user) {
    socketService.emitCartUpdate(req.user._id.toString(), cart);
  } else if (req.sessionId) {
    socketService.emitGuestCartUpdate(req.sessionId, cart);
  }

  return success(res, { cart }, 'Cart updated');
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:itemId
 * @access  Public (with session) / Private
 */
const removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart) {
    return notFound(res, 'Cart not found');
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return notFound(res, 'Item not found in cart');
  }

  // Remove item
  cart.items.pull(itemId);

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  // Populate for response
  await cart.populate('items.product', 'name slug images pricing inventory');

  // Emit real-time update
  if (req.user) {
    socketService.emitItemRemoved(req.user._id.toString(), null, itemId);
    socketService.emitCartUpdate(req.user._id.toString(), cart);
  } else if (req.sessionId) {
    socketService.emitItemRemoved(null, req.sessionId, itemId);
    socketService.emitGuestCartUpdate(req.sessionId, cart);
  }

  return success(res, { cart }, 'Item removed from cart');
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Public (with session) / Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart) {
    return success(res, { cart: { items: [], totals: { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 } } });
  }

  // Clear items
  cart.items = [];
  cart.coupon = undefined;
  cart.calculateTotals();
  await cart.save();

  // Emit real-time update
  if (req.user) {
    socketService.emitCartCleared(req.user._id.toString(), null);
  } else if (req.sessionId) {
    socketService.emitCartCleared(null, req.sessionId);
  }

  return success(res, { cart }, 'Cart cleared');
});

/**
 * @desc    Apply coupon
 * @route   POST /api/cart/coupon
 * @access  Public (with session) / Private
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart) {
    return notFound(res, 'Cart not found');
  }

  // TODO: Validate coupon against coupon service
  // For now, simulate coupon validation
  const coupon = {
    code: code.toUpperCase(),
    discountType: 'percentage',
    discountValue: 10, // 10% off
  };

  cart.coupon = coupon;
  cart.calculateTotals();
  await cart.save();

  await cart.populate('items.product', 'name slug images pricing inventory');

  return success(res, { cart }, `Coupon ${code} applied`);
});

/**
 * @desc    Remove coupon
 * @route   DELETE /api/cart/coupon
 * @access  Public (with session) / Private
 */
const removeCoupon = asyncHandler(async (req, res) => {
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart) {
    return notFound(res, 'Cart not found');
  }

  cart.coupon = undefined;
  cart.calculateTotals();
  await cart.save();

  await cart.populate('items.product', 'name slug images pricing inventory');

  return success(res, { cart }, 'Coupon removed');
});

/**
 * @desc    Merge guest cart with user cart after login
 * @route   POST /api/cart/merge
 * @access  Private
 */
const mergeCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return badRequest(res, 'Session ID required');
  }

  // Get guest cart
  const guestCart = await Cart.findOne({ sessionId });

  // Get or create user cart
  let userCart = await Cart.findOne({ user: req.user._id });
  if (!userCart) {
    userCart = await Cart.create({
      user: req.user._id,
      items: [],
      status: 'active',
    });
  }

  if (guestCart && guestCart.items.length > 0) {
    // Merge items
    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex(
        (item) => item.product.toString() === guestItem.product.toString() &&
          JSON.stringify(item.variant) === JSON.stringify(guestItem.variant)
      );

      if (existingIndex > -1) {
        // Add quantities
        userCart.items[existingIndex].quantity += guestItem.quantity;
      } else {
        // Add new item
        userCart.items.push(guestItem);
      }
    }

    // Transfer coupon if user cart doesn't have one
    if (!userCart.coupon && guestCart.coupon) {
      userCart.coupon = guestCart.coupon;
    }

    // Delete guest cart
    await Cart.findByIdAndDelete(guestCart._id);
  }

  // Calculate totals
  userCart.calculateTotals();
  await userCart.save();

  await userCart.populate('items.product', 'name slug images pricing inventory');

  return success(res, { cart: userCart }, 'Carts merged successfully');
});

/**
 * @desc    Get cart item count
 * @route   GET /api/cart/count
 * @access  Public (with session) / Private
 */
const getCartCount = asyncHandler(async (req, res) => {
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return success(res, { count: 0 });
  }

  const cart = await Cart.findOne(identifier);
  const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return success(res, { count });
});

/**
 * @desc    Validate cart before checkout
 * @route   POST /api/cart/validate
 * @access  Public (with session) / Private
 */
const validateCart = asyncHandler(async (req, res) => {
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Cart not found');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart || cart.items.length === 0) {
    return badRequest(res, 'Cart is empty');
  }

  const validationErrors = [];
  const updatedItems = [];

  for (const item of cart.items) {
    const product = await productService.getProduct(item.product.toString());

    if (!product) {
      validationErrors.push({
        itemId: item._id,
        error: 'Product no longer available',
      });
      continue;
    }

    if (!product.inventory.inStock) {
      validationErrors.push({
        itemId: item._id,
        productName: product.name,
        error: 'Product is out of stock',
      });
      continue;
    }

    if (product.inventory.quantity < item.quantity) {
      validationErrors.push({
        itemId: item._id,
        productName: product.name,
        error: `Only ${product.inventory.quantity} available`,
        availableQuantity: product.inventory.quantity,
      });
      continue;
    }

    // Check if price changed
    const currentPrice = product.pricing.salePrice || product.pricing.price;
    if (item.price !== currentPrice) {
      updatedItems.push({
        itemId: item._id,
        productName: product.name,
        oldPrice: item.price,
        newPrice: currentPrice,
      });
      item.price = currentPrice;
    }
  }

  // Update prices if changed
  if (updatedItems.length > 0) {
    cart.calculateTotals();
    await cart.save();
  }

  const isValid = validationErrors.length === 0;

  return success(res, {
    isValid,
    errors: validationErrors,
    priceUpdates: updatedItems,
    cart: isValid ? cart : null,
  });
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
  getCartCount,
  validateCart,
};
