/**
 * Socket.IO Proxy
 * Proxies WebSocket connections to Cart Service for real-time updates
 */

const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');

let io;

/**
 * Initialize Socket.IO proxy
 */
async function initializeSocketProxy(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  // Setup Redis adapter for scaling (optional)
  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      
      await Promise.all([pubClient.connect(), subClient.connect()]);
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log('📡 Socket.IO Redis adapter connected');
    } catch (error) {
      console.warn('⚠️ Redis adapter failed, using memory adapter:', error.message);
    }
  }

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.user?.id})`);

    // Join user-specific room
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Proxy cart events
    socket.on('cart:subscribe', () => {
      if (socket.user?.id) {
        socket.join(`cart:${socket.user.id}`);
        console.log(`📦 User ${socket.user.id} subscribed to cart updates`);
      }
    });

    socket.on('cart:unsubscribe', () => {
      if (socket.user?.id) {
        socket.leave(`cart:${socket.user.id}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('📡 Socket.IO proxy initialized');
  
  return io;
}

/**
 * Emit to user's room
 */
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit cart update
 */
function emitCartUpdate(userId, cart) {
  if (io) {
    io.to(`cart:${userId}`).emit('cart:updated', cart);
  }
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  return io;
}

module.exports = {
  initializeSocketProxy,
  emitToUser,
  emitCartUpdate,
  getIO
};
