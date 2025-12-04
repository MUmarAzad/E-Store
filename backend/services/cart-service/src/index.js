/**
 * Cart Service - Main Entry Point
 * Handles shopping cart with real-time updates
 */

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const { connectDB } = require('../../../config/database');
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('cart-service');
const PORT = process.env.PORT || 3002;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to MongoDB');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Cart Service running on port ${PORT}`);
      logger.info(`Socket.IO enabled for real-time cart updates`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Closing server gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
