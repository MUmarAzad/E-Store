import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { setCart } from '@/store/slices/cartSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { CartUpdatedEvent, CartPriceChangedEvent, CartStockWarningEvent } from '@/types';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:4000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(_userId?: string) {
    if (this.socket?.connected) {
      return;
    }

    const state = store.getState();
    const token = state.auth.tokens?.accessToken;

    // Don't connect if no token
    if (!token) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cart events
    this.socket.on('cart:updated', (data: CartUpdatedEvent) => {
      store.dispatch(setCart(data.cart));
      if (data.message) {
        store.dispatch(
          addNotification({
            type: 'info',
            message: data.message,
          })
        );
      }
    });

    this.socket.on('cart:price-changed', (data: CartPriceChangedEvent) => {
      store.dispatch(setCart(data.cart));
      store.dispatch(
        addNotification({
          type: 'warning',
          message: `Price changed for ${data.productName}: $${data.oldPrice} → $${data.newPrice}`,
        })
      );
    });

    this.socket.on('cart:stock-warning', (data: CartStockWarningEvent) => {
      store.dispatch(
        addNotification({
          type: 'warning',
          message: `Low stock: ${data.productName} - Only ${data.availableQuantity} left`,
        })
      );
    });

    // Order events
    this.socket.on('order:status-updated', (data: { orderId: string; status: string }) => {
      store.dispatch(
        addNotification({
          type: 'info',
          message: `Order #${data.orderId.slice(-6)} status updated to ${data.status}`,
        })
      );
    });

    // Admin events
    this.socket.on('admin:new-order', (data: { orderNumber: string; total: number }) => {
      store.dispatch(
        addNotification({
          type: 'success',
          message: `New order received: #${data.orderNumber} - $${data.total}`,
        })
      );
    });
  }

  // Join a specific room (e.g., for admin dashboard)
  joinRoom(room: string) {
    this.socket?.emit('join', room);
  }

  // Leave a room
  leaveRoom(room: string) {
    this.socket?.emit('leave', room);
  }

  // Check if connected
  get connected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;
