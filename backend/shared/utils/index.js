/**
 * Shared Utilities
 * Re-export all utility modules for easy importing
 */

const apiResponse = require('./apiResponse');
const asyncHandler = require('./asyncHandler');
const pagination = require('./pagination');
const logger = require('./logger');
const errors = require('./errors');
const helpers = require('./helpers');

module.exports = {
  // API Response utilities
  ...apiResponse,

  // Async Handler utilities
  ...asyncHandler,

  // Pagination utilities
  ...pagination,

  // Logger utilities
  ...logger,

  // Error classes
  ...errors,

  // Helper functions
  ...helpers,
};
