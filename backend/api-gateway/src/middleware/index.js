/**
 * Middleware Index
 */

const { notFoundHandler, errorHandler } = require('./error.middleware');
const { optionalAuth, requireAuth, requireAdmin } = require('./auth.middleware');

module.exports = {
  notFoundHandler,
  errorHandler,
  optionalAuth,
  requireAuth,
  requireAdmin
};
