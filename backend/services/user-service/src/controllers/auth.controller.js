/**
 * Authentication Controller
 * Handles user registration, login, logout, and password management
 */

const crypto = require('crypto');
const User = require('../models/User');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const { asyncHandler } = require('../../../../shared/utils');
const {
  success,
  created,
  badRequest,
  unauthorized,
  notFound,
  conflict,
} = require('../../../../shared/utils/apiResponse');
const {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../../../../shared/utils/errors');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return conflict(res, 'An account with this email already exists');
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    phone,
    isVerified: false,
    verificationToken: hashedToken,
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationUrl);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Continue with registration even if email fails
  }

  // Generate tokens
  const { accessToken, refreshToken } = await authService.generateTokens(user);

  // Set refresh token in HTTP-only cookie
  authService.setRefreshTokenCookie(res, refreshToken);

  // Return user data (without password)
  const userData = user.toJSON();

  return created(res, {
    user: userData,
    accessToken,
  }, 'Registration successful');
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for verification
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return unauthorized(res, 'Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    return unauthorized(res, 'Your account has been deactivated. Please contact support.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return unauthorized(res, 'Invalid email or password');
  }

  // Check if email is verified (optional: allow login but inform user)
  // You can uncomment below to block unverified users from logging in
  // if (!user.isVerified) {
  //   return unauthorized(res, 'Please verify your email before logging in');
  // }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const { accessToken, refreshToken } = await authService.generateTokens(user);

  // Set refresh token in HTTP-only cookie
  authService.setRefreshTokenCookie(res, refreshToken);

  // Return user data (without password)
  const userData = user.toJSON();

  return success(res, {
    user: userData,
    accessToken,
    // Include verification status in response
    requiresVerification: !user.isVerified,
  }, user.isVerified ? 'Login successful' : 'Login successful. Please verify your email to access all features.');
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with refresh token)
 */
const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    return unauthorized(res, 'Refresh token not provided');
  }

  try {
    // Verify and generate new tokens
    const tokens = await authService.refreshAccessToken(token);

    // Set new refresh token cookie
    authService.setRefreshTokenCookie(res, tokens.refreshToken);

    return success(res, {
      accessToken: tokens.accessToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    // Clear invalid refresh token
    authService.clearRefreshTokenCookie(res);
    return unauthorized(res, 'Invalid or expired refresh token');
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = asyncHandler(async (req, res) => {
  // Get refresh token from cookie
  const token = req.cookies?.refreshToken;

  if (token) {
    // Invalidate refresh token (add to blacklist or remove from DB)
    await authService.invalidateRefreshToken(token);
  }

  // Clear refresh token cookie
  authService.clearRefreshTokenCookie(res);

  return success(res, null, 'Logout successful');
});

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration
  if (!user) {
    return success(res, null, 'If an account with that email exists, a password reset link has been sent.');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Save hashed token to user
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // Send reset email
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail(user.email, user.firstName, resetUrl);
  } catch (error) {
    // If email fails, clear reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Failed to send password reset email:', error);
    // Still return success to prevent enumeration
  }

  return success(res, null, 'If an account with that email exists, a password reset link has been sent.');
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token from URL
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return badRequest(res, 'Invalid or expired password reset token');
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  // Invalidate all existing refresh tokens for this user
  await authService.invalidateAllUserTokens(user._id);

  return success(res, null, 'Password reset successful. Please log in with your new password.');
});

/**
 * @desc    Verify email with token
 * @route   POST /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Hash the token from URL
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid verification token
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return badRequest(res, 'Invalid or expired verification token');
  }

  // Verify the user
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return success(res, null, 'Email verified successfully. You can now log in.');
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Return success to prevent email enumeration
    return success(res, null, 'If an account with that email exists and is unverified, a verification email has been sent.');
  }

  if (user.isVerified) {
    return badRequest(res, 'This email is already verified');
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Save hashed token to user
  user.verificationToken = hashedToken;
  user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationUrl);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  return success(res, null, 'If an account with that email exists and is unverified, a verification email has been sent.');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
