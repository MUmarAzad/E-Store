/**
 * API Response Utility
 * Standardized response format for all API endpoints
 */

class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Send response to client
   * @param {Object} res - Express response object
   * @returns {Object} JSON response
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    });
  }
}

/**
 * Success Responses
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return new ApiResponse(statusCode, data, message).send(res);
};

const created = (res, data = null, message = 'Resource created successfully') => {
  return new ApiResponse(201, data, message).send(res);
};

const noContent = (res, message = 'Resource deleted successfully') => {
  return res.status(204).send();
};

const accepted = (res, data = null, message = 'Request accepted for processing') => {
  return new ApiResponse(202, data, message).send(res);
};

/**
 * Paginated Response
 */
const paginated = (res, { data, page, limit, total, message = 'Success' }) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error Responses
 */
const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const unauthorized = (res, message = 'Unauthorized access') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Access forbidden') => {
  return error(res, message, 403);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const conflict = (res, message = 'Resource conflict') => {
  return error(res, message, 409);
};

const unprocessable = (res, message = 'Unprocessable entity', errors = null) => {
  return error(res, message, 422, errors);
};

const tooManyRequests = (res, message = 'Too many requests') => {
  return error(res, message, 429);
};

const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500);
};

const serviceUnavailable = (res, message = 'Service temporarily unavailable') => {
  return error(res, message, 503);
};

module.exports = {
  ApiResponse,
  success,
  created,
  noContent,
  accepted,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  tooManyRequests,
  serverError,
  serviceUnavailable,
};
