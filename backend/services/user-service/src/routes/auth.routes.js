/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate } = require('../../../../shared/middleware');
const { userSchemas } = require('../../../../shared/schemas');

// Public routes
router.post(
  '/register',
  validate(userSchemas.register),
  authController.register
);

router.post(
  '/login',
  validate(userSchemas.login),
  authController.login
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

router.post(
  '/forgot-password',
  validate(userSchemas.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  validate(userSchemas.resetPassword),
  authController.resetPassword
);

router.post(
  '/logout',
  authController.logout
);

module.exports = router;
