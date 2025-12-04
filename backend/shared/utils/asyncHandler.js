/**
 * Async Handler Utility
 * Wraps async route handlers to catch errors automatically
 */

/**
 * Wrap async function to catch errors and pass to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrap async function with custom error handler
 * @param {Function} fn - Async function to wrap
 * @param {Function} errorHandler - Custom error handler function
 * @returns {Function} Express middleware function
 */
const asyncHandlerWithCallback = (fn, errorHandler) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error, req, res, next);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Execute multiple async operations in parallel
 * @param {Array<Function>} operations - Array of async functions
 * @returns {Promise<Array>} Array of results
 */
const parallel = async (operations) => {
  return Promise.all(operations.map((op) => op()));
};

/**
 * Execute async operations in sequence
 * @param {Array<Function>} operations - Array of async functions
 * @returns {Promise<Array>} Array of results
 */
const sequential = async (operations) => {
  const results = [];
  for (const op of operations) {
    results.push(await op());
  }
  return results;
};

/**
 * Retry async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.delay - Initial delay in ms (default: 1000)
 * @param {number} options.factor - Backoff factor (default: 2)
 * @returns {Promise<any>} Result of the function
 */
const retryAsync = async (fn, options = {}) => {
  const { maxRetries = 3, delay = 1000, factor = 2 } = options;
  let lastError;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= factor;
      }
    }
  }

  throw lastError;
};

/**
 * Execute async function with timeout
 * @param {Function} fn - Async function to execute
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} message - Error message on timeout
 * @returns {Promise<any>} Result of the function
 */
const withTimeout = async (fn, timeout, message = 'Operation timed out') => {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeout)
    ),
  ]);
};

module.exports = {
  asyncHandler,
  asyncHandlerWithCallback,
  parallel,
  sequential,
  retryAsync,
  withTimeout,
};
