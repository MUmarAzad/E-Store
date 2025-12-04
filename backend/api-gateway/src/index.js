/**
 * API Gateway Entry Point
 */

require('dotenv').config();

const app = require('./app');
const { createServer } = require('http');
const { initializeSocketProxy } = require('./socket');

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO proxy
initializeSocketProxy(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Service Routes:');
  console.log(`  /api/auth, /api/users     → User Service    (${process.env.USER_SERVICE_URL})`);
  console.log(`  /api/products, /api/categories → Product Service (${process.env.PRODUCT_SERVICE_URL})`);
  console.log(`  /api/cart                 → Cart Service    (${process.env.CART_SERVICE_URL})`);
  console.log(`  /api/orders, /api/payments → Order Service   (${process.env.ORDER_SERVICE_URL})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
