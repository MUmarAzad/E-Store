/**
 * User Routes
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate, authorize, validate } = require('../../../../shared/middleware');
const { userSchemas } = require('../../../../shared/schemas');

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
  validate(userSchemas.updateProfile),
  userController.updateProfile
);

// Change password
router.patch(
  '/me/password',
  validate(userSchemas.changePassword),
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
  validate(userSchemas.addAddress),
  userController.addAddress
);

// Update address
router.patch(
  '/me/addresses/:addressId',
  validate(userSchemas.updateAddress),
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
  validate(userSchemas.adminUpdateUser),
  userController.updateUser
);

// Delete user (admin only)
router.delete(
  '/:userId',
  authorize('admin'),
  userController.deleteUser
);

module.exports = router;
