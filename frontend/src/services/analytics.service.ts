import api from './api';

export interface DashboardMetrics {
  revenue: {
    total: number;
    change: string;
  };
  orders: {
    total: number;
    change: string;
  };
  avgOrderValue: {
    value: number;
    change: string;
  };
  statusBreakdown: Record<string, number>;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  slug: string;
  image?: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  avgPrice: number;
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  pricing: {
    total: number;
  };
  status: string;
  createdAt: string;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  slug: string;
  inventory: {
    quantity: number;
    lowStockThreshold: number;
  };
  images?: Array<{ url: string }>;
}

export const analyticsService = {
  // Get dashboard metrics
  async getDashboardMetrics(period: string = '30d'): Promise<{ metrics: DashboardMetrics; period: string }> {
    const response = await api.get<{ success: boolean; data: { metrics: DashboardMetrics; period: string } }>(
      `/admin/analytics/metrics?period=${period}`
    );
    return response.data.data;
  },

  // Get sales analytics
  async getSalesAnalytics(params: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  } = {}): Promise<{ sales: SalesDataPoint[]; startDate: string; endDate: string; groupBy: string }> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.groupBy) queryParams.append('groupBy', params.groupBy);

    const response = await api.get<{
      success: boolean;
      data: { sales: SalesDataPoint[]; startDate: string; endDate: string; groupBy: string };
    }>(`/admin/analytics/sales?${queryParams.toString()}`);
    return response.data.data;
  },

  // Get top products
  async getTopProducts(params: { limit?: number; period?: string } = {}): Promise<{ products: TopProduct[]; period: string }> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.period) queryParams.append('period', params.period);

    const response = await api.get<{
      success: boolean;
      data: { products: TopProduct[]; period: string };
    }>(`/admin/analytics/top-products?${queryParams.toString()}`);
    return response.data.data;
  },

  // Get recent orders
  async getRecentOrders(limit: number = 10): Promise<{ orders: RecentOrder[] }> {
    const response = await api.get<{
      success: boolean;
      data: { orders: RecentOrder[] };
    }>(`/admin/analytics/recent-orders?limit=${limit}`);
    return response.data.data;
  },

  // Get low stock products
  async getLowStockProducts(): Promise<{ products: LowStockProduct[] }> {
    const response = await api.get<{
      success: boolean;
      data: { products: LowStockProduct[] };
    }>('/admin/analytics/low-stock');
    return response.data.data;
  },
};
