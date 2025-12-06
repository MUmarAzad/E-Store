// ===================================
// API Types
// ===================================

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Error response
export interface ApiError {
  success: false;
  error: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
}

export type QueryParams = PaginationParams & SortParams & SearchParams;

// Auth responses
export interface LoginResponse {
  user: import('./user.types').User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

// Analytics types
export interface SalesMetric {
  date: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  image?: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface AnalyticsData {
  salesByDay: SalesMetric[];
  topProducts: TopProduct[];
  ordersByStatus: Record<string, number>;
  recentOrders: import('./order.types').Order[];
}
