/**
 * Authentication Service
 * Handles JWT token generation and management
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Token storage (in production, use Redis)
const refreshTokens = new Map();

/**
 * Generate access and refresh tokens
 * @param {Object} user - User document
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = async (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    { userId: user._id, tokenId: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Store refresh token (in production, store in Redis with TTL)
  refreshTokens.set(refreshToken, {
    userId: user._id.toString(),
    createdAt: Date.now(),
  });

  return { accessToken, refreshToken };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New access and refresh tokens
 */
const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // Check if token is in storage (not invalidated)
  const storedToken = refreshTokens.get(refreshToken);
  if (!storedToken) {
    throw new Error('Invalid refresh token');
  }

  // Get user
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  // Invalidate old refresh token
  refreshTokens.delete(refreshToken);

  // Generate new tokens
  return generateTokens(user);
};

/**
 * Invalidate refresh token
 * @param {string} refreshToken - Refresh token to invalidate
 */
const invalidateRefreshToken = async (refreshToken) => {
  refreshTokens.delete(refreshToken);
};

/**
 * Invalidate all refresh tokens for a user
 * @param {string} userId - User ID
 */
const invalidateAllUserTokens = async (userId) => {
  const userIdStr = userId.toString();
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === userIdStr) {
      refreshTokens.delete(token);
    }
  }
};

/**
 * Set refresh token cookie
 * @param {Object} res - Express response object
 * @param {string} refreshToken - Refresh token
 */
const setRefreshTokenCookie = (res, refreshToken) => {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/api/auth',
  });
};

/**
 * Clear refresh token cookie
 * @param {Object} res - Express response object
 */
const clearRefreshTokenCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/api/auth',
  });
};

/**
 * Verify access token
 * @param {string} token - Access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateTokens,
  refreshAccessToken,
  invalidateRefreshToken,
  invalidateAllUserTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  verifyAccessToken,
};
