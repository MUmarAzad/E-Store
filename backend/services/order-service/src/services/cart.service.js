/**
 * Cart Service
 * Communicates with Cart microservice
 */

const axios = require('axios');

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3002/api';

// Create axios instance
const cartClient = axios.create({
  baseURL: CART_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get cart for a user
 */
async function getCart(userId, token) {
  try {
    const response = await cartClient.get('/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    });

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching cart:', error.message);
    throw error;
  }
}

/**
 * Clear cart after order
 */
async function clearCart(userId, token) {
  try {
    await cartClient.delete('/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    });

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error.message);
    // Don't throw - cart clearing shouldn't fail the order
    return false;
  }
}

/**
 * Reserve cart items (prevent other orders)
 */
async function reserveCartItems(userId, orderId, token) {
  try {
    await cartClient.post('/cart/reserve', {
      orderId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    });

    return true;
  } catch (error) {
    console.error('Error reserving cart items:', error.message);
    return false;
  }
}

/**
 * Release reserved cart items (on order failure)
 */
async function releaseCartItems(userId, orderId, token) {
  try {
    await cartClient.post('/cart/release', {
      orderId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    });

    return true;
  } catch (error) {
    console.error('Error releasing cart items:', error.message);
    return false;
  }
}

module.exports = {
  getCart,
  clearCart,
  reserveCartItems,
  releaseCartItems
};
