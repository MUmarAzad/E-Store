/**
 * Helper Utility Functions
 * Common utility functions used across the application
 */

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a unique order ID
 * @param {string} prefix - Order ID prefix
 * @returns {string} Unique order ID
 */
const generateOrderId = (prefix = 'ORD') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateRandomString(6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Slugify a string
 * @param {string} text - Text to slugify
 * @returns {string} Slugified string
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (obj instanceof Object) {
    const copy = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepClone(obj[key]);
      }
    }
    return copy;
  }
  return obj;
};

/**
 * Pick specific keys from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to pick
 * @returns {Object} Object with picked keys
 */
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Omit specific keys from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to omit
 * @returns {Object} Object without omitted keys
 */
const omit = (obj, keys) => {
  const keysToOmit = new Set(keys);
  return Object.keys(obj).reduce((acc, key) => {
    if (!keysToOmit.has(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Flatten nested object
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Key prefix
 * @returns {Object} Flattened object
 */
const flatten = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flatten(obj[key], prefixedKey));
    } else {
      acc[prefixedKey] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Format price to currency string
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted price
 */
const formatPrice = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places
 * @returns {number} Percentage
 */
const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * Calculate discount amount
 * @param {number} originalPrice - Original price
 * @param {number} discountPercentage - Discount percentage
 * @returns {Object} Discount details
 */
const calculateDiscount = (originalPrice, discountPercentage) => {
  const discountAmount = (originalPrice * discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;
  return {
    originalPrice,
    discountPercentage,
    discountAmount: Number(discountAmount.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} Is valid ObjectId
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Mask sensitive data (e.g., email, phone)
 * @param {string} value - Value to mask
 * @param {number} visibleStart - Visible characters at start
 * @param {number} visibleEnd - Visible characters at end
 * @returns {string} Masked value
 */
const maskSensitiveData = (value, visibleStart = 3, visibleEnd = 3) => {
  if (!value || value.length <= visibleStart + visibleEnd) return value;
  const start = value.substring(0, visibleStart);
  const end = value.substring(value.length - visibleEnd);
  const masked = '*'.repeat(Math.min(value.length - visibleStart - visibleEnd, 10));
  return `${start}${masked}${end}`;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Array of chunks
 */
const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Get unique values from array
 * @param {Array} array - Array with duplicates
 * @param {string} key - Key for object arrays
 * @returns {Array} Array with unique values
 */
const unique = (array, key = null) => {
  if (key) {
    const seen = new Set();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
};

module.exports = {
  generateRandomString,
  generateOrderId,
  slugify,
  deepClone,
  pick,
  omit,
  flatten,
  formatPrice,
  calculatePercentage,
  calculateDiscount,
  isValidEmail,
  isValidObjectId,
  maskSensitiveData,
  sleep,
  debounce,
  chunk,
  unique,
};
