const { ZodError } = require('zod');

/**
 * Validation Middleware Factory
 * Creates a middleware that validates request data against a Zod schema
 * 
 * @param {Object} schemas - Object containing schemas for body, query, params
 * @param {import('zod').ZodSchema} [schemas.body] - Schema for request body
 * @param {import('zod').ZodSchema} [schemas.query] - Schema for query params
 * @param {import('zod').ZodSchema} [schemas.params] - Schema for URL params
 * @returns {Function} Express middleware
 */
const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      const errors = [];

      // Validate body
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'body'));
        } else {
          req.body = result.data; // Use parsed/transformed data
        }
      }

      // Validate query
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'query'));
        } else {
          req.query = result.data;
        }
      }

      // Validate params
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'params'));
        } else {
          req.params = result.data;
        }
      }

      // If there are validation errors, return them
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Format Zod errors into a consistent structure
 * @param {ZodError} zodError - Zod validation error
 * @param {string} location - Where the error occurred (body, query, params)
 * @returns {Array} Formatted errors
 */
const formatZodErrors = (zodError, location) => {
  return zodError.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    location,
    code: err.code,
  }));
};

/**
 * Validate body only (shorthand)
 * @param {import('zod').ZodSchema} schema - Zod schema for body
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => validate({ body: schema });

/**
 * Validate query only (shorthand)
 * @param {import('zod').ZodSchema} schema - Zod schema for query
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => validate({ query: schema });

/**
 * Validate params only (shorthand)
 * @param {import('zod').ZodSchema} schema - Zod schema for params
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => validate({ params: schema });

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
