/**
 * User Routes
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate, authorize, validateBody } = require('../../../../shared/middleware');
const { userSchemas } = require('../../../../shared/schemas');

// Debug logging
router.use((req, res, next) => {
  console.log(`[USER-ROUTES] ${req.method} ${req.path}`);
  console.log(`[USER-ROUTES] Body:`, req.body);
  console.log(`[USER-ROUTES] Body keys:`, req.body ? Object.keys(req.body) : 'NO BODY');
  next();
});

// All routes require authentication
router.use(authenticate);

// =============================================================================
// PROFILE ROUTES
// =============================================================================

// Get current user profile
router.get('/me', userController.getProfile);

// Update current user profile
router.patch(
  '/me',
  (req, res, next) => { console.log('[USER-ROUTES] Before validateBody'); next(); },
  validateBody(userSchemas.updateProfile),
  (req, res, next) => { console.log('[USER-ROUTES] After validateBody, before controller'); next(); },
  userController.updateProfile,
  (req, res, next) => { console.log('[USER-ROUTES] After controller'); next(); }
);

// Change password
router.patch(
  '/me/password',
  validateBody(userSchemas.changePassword),
  userController.changePassword
);

// Delete account (soft delete)
router.delete('/me', userController.deleteAccount);

// =============================================================================
// ADDRESS ROUTES
// =============================================================================

// Get all addresses
router.get('/me/addresses', userController.getAddresses);

// Add new address
router.post(
  '/me/addresses',
  validateBody(userSchemas.addAddress),
  userController.addAddress
);

// Update address
router.patch(
  '/me/addresses/:addressId',
  validateBody(userSchemas.updateAddress),
  userController.updateAddress
);

// Delete address
router.delete('/me/addresses/:addressId', userController.deleteAddress);

// Set default address
router.patch('/me/addresses/:addressId/default', userController.setDefaultAddress);

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Get all users (admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  userController.getAllUsers
);

// Get user by ID (admin only)
router.get(
  '/:userId',
  authorize('admin'),
  userController.getUserById
);

// Update user (admin only)
router.patch(
  '/:userId',
  authorize('admin'),
  validateBody(userSchemas.adminUpdateUser),
  userController.updateUser
);

// Delete user (admin only)
router.delete(
  '/:userId',
  authorize('admin'),
  userController.deleteUser
);

module.exports = router;
