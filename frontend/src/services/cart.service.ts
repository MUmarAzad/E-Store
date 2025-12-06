import api from './api';
import { Cart, AddToCartData, UpdateCartItemData } from '@/types';

export const cartService = {
  // Get Cart
  async getCart(): Promise<Cart> {
    const response = await api.get<{ success: boolean; data: Cart }>('/cart');
    return response.data.data;
  },

  // Add Item to Cart
  async addItem(data: AddToCartData): Promise<Cart> {
    const response = await api.post<{ success: boolean; data: Cart }>('/cart/items', data);
    return response.data.data;
  },

  // Update Cart Item
  async updateItem(data: UpdateCartItemData): Promise<Cart> {
    const response = await api.put<{ success: boolean; data: Cart }>(
      `/cart/items/${data.productId}`,
      { quantity: data.quantity }
    );
    return response.data.data;
  },

  // Remove Item from Cart
  async removeItem(productId: string): Promise<Cart> {
    const response = await api.delete<{ success: boolean; data: Cart }>(
      `/cart/items/${productId}`
    );
    return response.data.data;
  },

  // Clear Cart
  async clearCart(): Promise<void> {
    await api.delete('/cart');
  },

  // Merge Guest Cart (after login)
  async mergeCart(sessionId: string): Promise<Cart> {
    const response = await api.post<{ success: boolean; data: Cart }>('/cart/merge', {
      sessionId,
    });
    return response.data.data;
  },

  // Refresh Cart Prices
  async refreshPrices(): Promise<Cart> {
    const response = await api.post<{ success: boolean; data: Cart }>('/cart/refresh-prices');
    return response.data.data;
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
