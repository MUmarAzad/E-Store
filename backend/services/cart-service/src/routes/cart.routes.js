/**
 * Cart Routes
 */

const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart.controller');
const { authenticate, validateBody } = require('../../../../shared/middleware');
const { cartSchemas } = require('../../../../shared/schemas');

// Middleware to handle both authenticated and guest users
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Has token, use authenticate middleware
    return authenticate(req, res, next);
  }
  
  // No token, treat as guest (session-based)
  req.sessionId = req.headers['x-session-id'] || req.query.sessionId;
  next();
};

// =============================================================================
// CART ROUTES (Support both authenticated and guest users)
// =============================================================================

// Get cart
router.get('/', optionalAuth, cartController.getCart);

// Add item to cart
router.post(
  '/items',
  optionalAuth,
  validateBody(cartSchemas.addItem),
  cartController.addItem
);

// Update item quantity
router.patch(
  '/items/:itemId',
  optionalAuth,
  validateBody(cartSchemas.updateItem),
  cartController.updateItem
);

// Remove item from cart
router.delete(
  '/items/:itemId',
  optionalAuth,
  cartController.removeItem
);

// Clear cart
router.delete('/', optionalAuth, cartController.clearCart);

// Apply coupon
router.post(
  '/coupon',
  optionalAuth,
  validateBody(cartSchemas.applyCoupon),
  cartController.applyCoupon
);

// Remove coupon
router.delete('/coupon', optionalAuth, cartController.removeCoupon);

// =============================================================================
// AUTHENTICATED ONLY ROUTES
// =============================================================================

// Merge guest cart with user cart (after login)
router.post(
  '/merge',
  authenticate,
  cartController.mergeCart
);

// Get cart count (for navbar badge)
router.get('/count', optionalAuth, cartController.getCartCount);

// Validate cart (check stock, prices before checkout)
router.post('/validate', optionalAuth, cartController.validateCart);

module.exports = router;
