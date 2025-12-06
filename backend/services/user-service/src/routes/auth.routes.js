/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validateBody } = require('../../../../shared/middleware');
const { userSchemas } = require('../../../../shared/schemas');

// Public routes
router.post(
  '/register',
  validateBody(userSchemas.register),
  authController.register
);

router.post(
  '/login',
  validateBody(userSchemas.login),
  authController.login
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

router.post(
  '/forgot-password',
  validateBody(userSchemas.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  validateBody(userSchemas.resetPassword),
  authController.resetPassword
);

router.post(
  '/logout',
  authController.logout
);

module.exports = router;
