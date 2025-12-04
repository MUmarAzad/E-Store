/**
 * Socket.IO Configuration
 * Real-time cart updates
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('socket.io');

let io;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      // Allow guest connections with session ID
      socket.userId = null;
      socket.sessionId = socket.handshake.query.sessionId || socket.id;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.sessionId = null;
      next();
    } catch (error) {
      // Token invalid, treat as guest
      socket.userId = null;
      socket.sessionId = socket.handshake.query.sessionId || socket.id;
      next();
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const identifier = socket.userId || socket.sessionId;
    logger.debug('Client connected', { socketId: socket.id, userId: socket.userId, sessionId: socket.sessionId });

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    } else if (socket.sessionId) {
      socket.join(`session:${socket.sessionId}`);
    }

    // Handle cart subscription
    socket.on('subscribe:cart', (data) => {
      const { cartId } = data;
      if (cartId) {
        socket.join(`cart:${cartId}`);
        logger.debug('Subscribed to cart', { socketId: socket.id, cartId });
      }
    });

    // Handle cart unsubscription
    socket.on('unsubscribe:cart', (data) => {
      const { cartId } = data;
      if (cartId) {
        socket.leave(`cart:${cartId}`);
        logger.debug('Unsubscribed from cart', { socketId: socket.id, cartId });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.debug('Client disconnected', { socketId: socket.id, reason });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, error: error.message });
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 * @returns {Object} Socket.IO server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit cart update to specific user
 * @param {string} userId - User ID
 * @param {Object} cart - Updated cart data
 */
const emitCartUpdate = (userId, cart) => {
  if (!io) return;

  if (userId) {
    io.to(`user:${userId}`).emit('cart:updated', cart);
  }
};

/**
 * Emit cart update to guest session
 * @param {string} sessionId - Session ID
 * @param {Object} cart - Updated cart data
 */
const emitGuestCartUpdate = (sessionId, cart) => {
  if (!io) return;

  if (sessionId) {
    io.to(`session:${sessionId}`).emit('cart:updated', cart);
  }
};

/**
 * Emit cart item added event
 * @param {string} userId - User ID or null
 * @param {string} sessionId - Session ID for guests
 * @param {Object} item - Added item
 */
const emitItemAdded = (userId, sessionId, item) => {
  if (!io) return;

  const room = userId ? `user:${userId}` : `session:${sessionId}`;
  io.to(room).emit('cart:item_added', item);
};

/**
 * Emit cart item removed event
 * @param {string} userId - User ID or null
 * @param {string} sessionId - Session ID for guests
 * @param {string} itemId - Removed item ID
 */
const emitItemRemoved = (userId, sessionId, itemId) => {
  if (!io) return;

  const room = userId ? `user:${userId}` : `session:${sessionId}`;
  io.to(room).emit('cart:item_removed', { itemId });
};

/**
 * Emit cart cleared event
 * @param {string} userId - User ID or null
 * @param {string} sessionId - Session ID for guests
 */
const emitCartCleared = (userId, sessionId) => {
  if (!io) return;

  const room = userId ? `user:${userId}` : `session:${sessionId}`;
  io.to(room).emit('cart:cleared');
};

module.exports = {
  initializeSocket,
  getIO,
  emitCartUpdate,
  emitGuestCartUpdate,
  emitItemAdded,
  emitItemRemoved,
  emitCartCleared,
};
