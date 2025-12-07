/**
 * Product Service Client
 * Communicates with Product Service to get product data
 */

const axios = require('axios');
const { createLogger } = require('../../../../shared/utils/logger');

const logger = createLogger('product-service-client');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

// Create axios instance
const productApi = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  timeout: 5000,
});

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} Product data or null
 */
const getProduct = async (productId) => {
  try {
    const response = await productApi.get(`/api/products/${productId}`);
    // Backend returns { success, data: { product } }
    return response.data.data?.product || response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    logger.error('Failed to fetch product', { productId, error: error.message });
    throw error;
  }
};

/**
 * Get multiple products by IDs
 * @param {Array<string>} productIds - Product IDs
 * @returns {Promise<Array<Object>>} Array of products
 */
const getProducts = async (productIds) => {
  try {
    const response = await productApi.get('/api/products', {
      params: { ids: productIds.join(',') },
    });
    return response.data.data.products || [];
  } catch (error) {
    logger.error('Failed to fetch products', { productIds, error: error.message });
    throw error;
  }
};

/**
 * Check product stock
 * @param {string} productId - Product ID
 * @param {number} quantity - Required quantity
 * @returns {Promise<Object>} Stock status
 */
const checkStock = async (productId, quantity) => {
  try {
    const product = await getProduct(productId);
    
    if (!product) {
      return { available: false, reason: 'Product not found' };
    }

    if (!product.inventory.inStock) {
      return { available: false, reason: 'Out of stock' };
    }

    if (product.inventory.quantity < quantity) {
      return {
        available: false,
        reason: 'Insufficient stock',
        availableQuantity: product.inventory.quantity,
      };
    }

    return {
      available: true,
      product,
      availableQuantity: product.inventory.quantity,
    };
  } catch (error) {
    logger.error('Failed to check stock', { productId, error: error.message });
    return { available: false, reason: 'Unable to verify stock' };
  }
};

module.exports = {
  getProduct,
  getProducts,
  checkStock,
};
