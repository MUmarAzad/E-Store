// ===================================
// Cart Types
// ===================================

import { Product } from './product.types';

export interface CartItem {
  _id?: string;
  productId: string;
  product?: Product; // Populated product details
  quantity: number;
  price: number; // Price snapshot at add time
  addedAt: string;
}

export interface Cart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartState {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}

// Cart operations
export interface AddToCartData {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemData {
  productId: string;
  quantity: number;
}

// Cart events (Socket.IO)
export interface CartUpdatedEvent {
  cart: Cart;
  message: string;
}

export interface CartPriceChangedEvent {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  cart: Cart;
}

export interface CartStockWarningEvent {
  productId: string;
  productName: string;
  availableQuantity: number;
  requestedQuantity: number;
}
