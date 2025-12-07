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
    // Handle both _id and userId fields
    const userId = req.user._id || req.user.userId;
    return userId ? { userId: userId } : null;
  }
  if (req.sessionId) {
    return { sessionId: req.sessionId };
  }
  return null;
};

/**
 * Format cart for response - keep productId as string and product as separate field
 */
const formatCartResponse = (cart) => {
  const cartObj = cart.toObject({ virtuals: true });
  
  // Transform items to keep productId as string
  cartObj.items = cartObj.items.map(item => {
    const productId = item.productId?._id || item.productId;
    const product = item.productId?._id ? item.productId : undefined;
    
    return {
      _id: item._id,
      productId: productId.toString(),
      product: product,
      quantity: item.quantity,
      price: item.price,
      addedAt: item.addedAt,
      subtotal: item.subtotal
    };
  });
  
  return cartObj;
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
  await cart.populate('items.productId', 'name slug images price inventory stock');

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  return success(res, { cart: formatCartResponse(cart) });
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

  // Check stock availability
  const availableStock = product.stock || product.inventory?.quantity || 0;
  
  if (availableStock < quantity) {
    return badRequest(res, `Only ${availableStock} items available in stock`);
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
    (item) => item.productId.toString() === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Check stock
    if (newQuantity > availableStock) {
      return badRequest(res, `Cannot add more. Only ${availableStock} items available in stock`);
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price;
  } else {
    // Add new item
    cart.items.push({
      productId: productId,
      quantity,
      price: product.price,
      variant,
    });
  }

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  // Populate for response
  await cart.populate('items.productId', 'name slug images price inventory stock');

  // Emit real-time update
  if (req.user?._id || req.user?.userId) {
    const userId = req.user._id || req.user.userId;
    socketService.emitCartUpdate(userId.toString(), cart);
  } else if (req.sessionId) {
    socketService.emitGuestCartUpdate(req.sessionId, cart);
  }

  return success(res, { cart: formatCartResponse(cart) }, 'Item added to cart');
});

/**
 * @desc    Update item quantity
 * @route   PATCH /api/cart/items/:productId
 * @access  Public (with session) / Private
 */
const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart) {
    return notFound(res, 'Cart not found');
  }

  // Find item by productId
  const item = cart.items.find(
    (item) => item.productId.toString() === productId
  );
  
  if (!item) {
    return notFound(res, 'Item not found in cart');
  }

  // Verify stock
  const product = await productService.getProduct(productId);
  if (!product) {
    return notFound(res, 'Product no longer available');
  }

  const availableStock = product.stock || product.inventory?.quantity || 0;
  if (quantity > availableStock) {
    return badRequest(res, `Only ${availableStock} items available`);
  }

  // Update quantity
  item.quantity = quantity;
  item.price = product.price;

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  // Populate for response
  await cart.populate('items.productId', 'name slug images price inventory stock');

  // Emit real-time update
  if (req.user?._id || req.user?.userId) {
    const userId = req.user._id || req.user.userId;
    socketService.emitCartUpdate(userId.toString(), cart);
  } else if (req.sessionId) {
    socketService.emitGuestCartUpdate(req.sessionId, cart);
  }

  return success(res, { cart: formatCartResponse(cart) }, 'Cart updated');
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:productId
 * @access  Public (with session) / Private
 */
const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const identifier = getCartIdentifier(req);

  if (!identifier) {
    return badRequest(res, 'Session ID required for guest cart');
  }

  const cart = await Cart.findOne(identifier);
  if (!cart) {
    return notFound(res, 'Cart not found');
  }

  // Find item by productId
  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );
  
  if (itemIndex === -1) {
    return notFound(res, 'Item not found in cart');
  }

  // Remove item
  cart.items.splice(itemIndex, 1);

  // Calculate totals
  cart.calculateTotals();
  await cart.save();

  // Populate for response
  await cart.populate('items.productId', 'name slug images price inventory stock');

  // Emit real-time update
  if (req.user?._id || req.user?.userId) {
    const userId = req.user._id || req.user.userId;
    socketService.emitItemRemoved(userId.toString(), null, productId);
    socketService.emitCartUpdate(userId.toString(), cart);
  } else if (req.sessionId) {
    socketService.emitItemRemoved(null, req.sessionId, productId);
    socketService.emitGuestCartUpdate(req.sessionId, cart);
  }

  return success(res, { cart: formatCartResponse(cart) }, 'Item removed from cart');
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
  if (req.user?._id || req.user?.userId) {
    const userId = req.user._id || req.user.userId;
    socketService.emitCartCleared(userId.toString(), null);
  } else if (req.sessionId) {
    socketService.emitCartCleared(null, req.sessionId);
  }

  return success(res, { cart: formatCartResponse(cart) }, 'Cart updated');
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

  await cart.populate('items.productId', 'name slug images price inventory stock');

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

  await cart.populate('items.productId', 'name slug images price inventory stock');

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
  const userId = req.user._id || req.user.userId;
  let userCart = await Cart.findOne({ userId: userId });
  if (!userCart) {
    userCart = await Cart.create({
      userId: userId,
      items: [],
      status: 'active',
    });
  }

  if (guestCart && guestCart.items.length > 0) {
    // Merge items
    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex(
        (item) => item.productId.toString() === guestItem.productId.toString() &&
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

  await userCart.populate('items.productId', 'name slug images price inventory stock');

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
    const product = await productService.getProduct(item.productId.toString());

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
    const currentPrice = product.price;
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
