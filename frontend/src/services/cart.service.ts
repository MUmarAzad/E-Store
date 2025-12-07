import api from './api';
import { Cart, AddToCartData, UpdateCartItemData } from '@/types';

export const cartService = {
  // Get Cart
  async getCart(): Promise<Cart> {
    const response = await api.get<{ success: boolean; data: { cart: Cart } }>('/cart');
    return response.data.data.cart;
  },

  // Add Item to Cart
  async addItem(data: AddToCartData): Promise<Cart> {
    const response = await api.post<{ success: boolean; data: { cart: Cart } }>('/cart/items', data);
    return response.data.data.cart;
  },

  // Update Cart Item
  async updateItem(data: UpdateCartItemData): Promise<Cart> {
    const response = await api.patch<{ success: boolean; data: { cart: Cart } }>(
      `/cart/items/${data.productId}`,
      { quantity: data.quantity }
    );
    return response.data.data.cart;
  },

  // Remove Item from Cart
  async removeItem(productId: string): Promise<Cart> {
    const response = await api.delete<{ success: boolean; data: { cart: Cart } }>(
      `/cart/items/${productId}`
    );
    return response.data.data.cart;
  },

  // Clear Cart
  async clearCart(): Promise<void> {
    await api.delete('/cart');
  },

  // Merge Guest Cart (after login)
  async mergeCart(sessionId: string): Promise<Cart> {
    const response = await api.post<{ success: boolean; data: { cart: Cart } }>('/cart/merge', {
      sessionId,
    });
    return response.data.data.cart;
  },

  // Refresh Cart Prices
  async refreshPrices(): Promise<Cart> {
    const response = await api.post<{ success: boolean; data: { cart: Cart } }>('/cart/refresh-prices');
    return response.data.data.cart;
  },

  // Validate Cart (check stock before checkout)
  async validateCart(): Promise<{ valid: boolean; issues: string[] }> {
    const response = await api.post<{
      success: boolean;
      data: { valid: boolean; issues: string[] };
    }>('/cart/validate');
    return response.data.data;
  },
};
