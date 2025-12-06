// ===================================
// Order Types
// ===================================

import { Address } from './user.types';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'paypal' | 'cod';

export interface PaymentInfo {
  method: PaymentMethod;
  transactionId?: string;
  status: PaymentStatus;
}

export interface OrderPricing {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface OrderUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  user?: OrderUser;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  payment: PaymentInfo;
  pricing: OrderPricing;
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Checkout form data
export interface CheckoutFormData {
  shippingAddress: Address;
  billingAddress?: Address;
  sameAsShipping?: boolean;
  paymentMethod: PaymentMethod;
  paymentInfo?: {
    method: string;
    cardLast4?: string;
  };
}

// Order filters (admin)
export interface OrderFilters {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}
