/**
 * Pagination Utility
 * Helper functions for paginating database queries
 */

/**
 * Default pagination options
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed pagination options
 */
const parsePaginationParams = (query) => {
  let page = parseInt(query.page) || DEFAULT_PAGE;
  let limit = parseInt(query.limit) || DEFAULT_LIMIT;

  // Ensure page is at least 1
  page = Math.max(1, page);

  // Ensure limit is within bounds
  limit = Math.min(Math.max(1, limit), MAX_LIMIT);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Parse sort parameters from request query
 * @param {string} sortQuery - Sort query string (e.g., "-createdAt,name")
 * @param {Array<string>} allowedFields - Array of allowed sort fields
 * @returns {Object} MongoDB sort object
 */
const parseSortParams = (sortQuery, allowedFields = []) => {
  if (!sortQuery) {
    return { createdAt: -1 }; // Default sort by newest first
  }

  const sortFields = sortQuery.split(',');
  const sort = {};

  for (const field of sortFields) {
    const trimmedField = field.trim();
    const isDescending = trimmedField.startsWith('-');
    const fieldName = isDescending ? trimmedField.substring(1) : trimmedField;

    // Only add field if it's in the allowed list or no restrictions
    if (allowedFields.length === 0 || allowedFields.includes(fieldName)) {
      sort[fieldName] = isDescending ? -1 : 1;
    }
  }

  // Return default if no valid fields
  return Object.keys(sort).length > 0 ? sort : { createdAt: -1 };
};

/**
 * Parse filter parameters from request query
 * @param {Object} query - Express request query object
 * @param {Object} filterConfig - Configuration for allowed filters
 * @returns {Object} MongoDB filter object
 */
const parseFilterParams = (query, filterConfig = {}) => {
  const filter = {};

  for (const [key, config] of Object.entries(filterConfig)) {
    const value = query[key];

    if (value === undefined || value === '') continue;

    switch (config.type) {
      case 'exact':
        filter[config.field || key] = value;
        break;

      case 'boolean':
        filter[config.field || key] = value === 'true';
        break;

      case 'number':
        filter[config.field || key] = parseFloat(value);
        break;

      case 'array':
        filter[config.field || key] = { $in: value.split(',') };
        break;

      case 'search':
        filter[config.field || key] = { $regex: value, $options: 'i' };
        break;

      case 'range':
        const rangeFilter = {};
        if (query[`${key}Min`]) {
          rangeFilter.$gte = parseFloat(query[`${key}Min`]);
        }
        if (query[`${key}Max`]) {
          rangeFilter.$lte = parseFloat(query[`${key}Max`]);
        }
        if (Object.keys(rangeFilter).length > 0) {
          filter[config.field || key] = rangeFilter;
        }
        break;

      case 'dateRange':
        const dateFilter = {};
        if (query[`${key}From`]) {
          dateFilter.$gte = new Date(query[`${key}From`]);
        }
        if (query[`${key}To`]) {
          dateFilter.$lte = new Date(query[`${key}To`]);
        }
        if (Object.keys(dateFilter).length > 0) {
          filter[config.field || key] = dateFilter;
        }
        break;

      default:
        filter[config.field || key] = value;
    }
  }

  return filter;
};

/**
 * Build pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};

/**
 * Paginate Mongoose query
 * @param {Object} Model - Mongoose model
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated results
 */
const paginateQuery = async (Model, options = {}) => {
  const {
    filter = {},
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort = { createdAt: -1 },
    select = '',
    populate = '',
  } = options;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Model.find(filter)
      .select(select)
      .populate(populate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

/**
 * Paginate aggregation pipeline
 * @param {Object} Model - Mongoose model
 * @param {Array} pipeline - Aggregation pipeline
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated results
 */
const paginateAggregate = async (Model, pipeline, options = {}) => {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;
  const skip = (page - 1) * limit;

  const facetPipeline = [
    ...pipeline,
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Model.aggregate(facetPipeline);

  const data = result.data;
  const total = result.total[0]?.count || 0;

  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  buildPaginationMeta,
  paginateQuery,
  paginateAggregate,
};
