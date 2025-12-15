import api from './api';
import { 
  Order, 
  OrderFilters, 
  OrderStatus, 
  CheckoutFormData,
  PaginatedResponse,
  AnalyticsData,
  DashboardMetrics 
} from '@/types';

interface OrderQueryParams extends OrderFilters {
  page?: number;
  limit?: number;
}

export const orderService = {
  // Create Order (Checkout)
  async createOrder(data: CheckoutFormData): Promise<Order> {
    const response = await api.post<{ success: boolean; data: Order }>('/orders', data);
    return response.data.data;
  },

  // Get User's Orders
  async getOrders(params: OrderQueryParams = {}): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return response.data;
  },

  // Get Order by ID
  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return response.data.data;
  },

  // Cancel Order
  async cancelOrder(id: string): Promise<Order> {
    const response = await api.patch<{ success: boolean; data: Order }>(`/orders/${id}/cancel`);
    return response.data.data;
  },

  // Get All Orders (Admin)
  async getAllOrders(params: OrderQueryParams = {}): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>('/admin/orders', { params });
    return response.data;
  },

  // Update Order Status (Admin)
  async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Order> {
    const response = await api.patch<{ success: boolean; data: Order }>(
      `/admin/orders/${id}/status`,
      { status, note }
    );
    return response.data.data;
  },

  // Get Sales Analytics (Admin)
  async getSalesAnalytics(startDate?: string, endDate?: string): Promise<AnalyticsData> {
    const response = await api.get<{ success: boolean; data: AnalyticsData }>('/admin/analytics', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  // Get Dashboard Metrics (Admin)
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await api.get<{ success: boolean; data: DashboardMetrics }>(
      '/admin/dashboard'
    );
    return response.data.data;
  },

  // Get Order Statistics (Admin)
  async getOrderStats(): Promise<Record<OrderStatus, number>> {
    const response = await api.get<{ success: boolean; data: Record<OrderStatus, number> }>(
      '/admin/orders/stats'
    );
    return response.data.data;
  },

  // Export Orders (Admin)
  async exportOrders(params: OrderQueryParams = {}): Promise<Blob> {
    const response = await api.get('/admin/orders/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
