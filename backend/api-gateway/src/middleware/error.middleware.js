/**
 * Error Handling Middleware
 */

/**
 * Not found handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    requestId: req.id
  });
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  console.error(`[${req.id}] Error:`, err);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
