import api from './api';
import { 
  Product, 
  Category, 
  ProductFormData, 
  ProductFilters,
  PaginatedResponse 
} from '@/types';

interface ProductQueryParams extends ProductFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const productService = {
  // Get Products with filters and pagination
  async getProducts(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  },

  // Get Product by ID
  async getProductById(id: string): Promise<Product> {
    const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return response.data.data;
  },

  // Get Product by Slug
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get<{ success: boolean; data: Product }>(`/products/slug/${slug}`);
    return response.data.data;
  },

  // Search Products
  async searchProducts(query: string, params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>('/products', {
      params: { ...params, search: query },
    });
    return response.data;
  },

  // Create Product (Admin)
  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await api.post<{ success: boolean; data: Product }>('/products', data);
    return response.data.data;
  },

  // Update Product (Admin)
  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const response = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
    return response.data.data;
  },

  // Delete Product (Admin)
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  // Upload Product Images (Admin)
  async uploadImages(id: string, files: File[]): Promise<Product> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const response = await api.post<{ success: boolean; data: Product }>(
      `/products/${id}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Delete Product Image (Admin)
  async deleteImage(productId: string, imageId: string): Promise<Product> {
    const response = await api.delete<{ success: boolean; data: Product }>(
      `/products/${productId}/images/${imageId}`
    );
    return response.data.data;
  },

  // Set Primary Image (Admin)
  async setPrimaryImage(productId: string, imageId: string): Promise<Product> {
    const response = await api.put<{ success: boolean; data: Product }>(
      `/products/${productId}/images/${imageId}/primary`
    );
    return response.data.data;
  },

  // Update Inventory (Admin)
  async updateInventory(
    productId: string,
    quantity: number,
    lowStockThreshold?: number
  ): Promise<Product> {
    const response = await api.patch<{ success: boolean; data: Product }>(
      `/products/${productId}/inventory`,
      { quantity, lowStockThreshold }
    );
    return response.data.data;
  },

  // Get Categories
  async getCategories(): Promise<Category[]> {
    const response = await api.get<{ success: boolean; data: Category[] }>('/categories');
    return response.data.data;
  },

  // Get Category by ID
  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get<{ success: boolean; data: Category }>(`/categories/${id}`);
    return response.data.data;
  },

  // Create Category (Admin)
  async createCategory(data: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const response = await api.post<{ success: boolean; data: Category }>('/categories', data);
    return response.data.data;
  },

  // Update Category (Admin)
  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await api.put<{ success: boolean; data: Category }>(`/categories/${id}`, data);
    return response.data.data;
  },

  // Delete Category (Admin)
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  // Get Low Stock Products (Admin)
  async getLowStockProducts(): Promise<Product[]> {
    const response = await api.get<{ success: boolean; data: Product[] }>('/products/low-stock');
    return response.data.data;
  },

  // Bulk Update Products Status (Admin)
  async bulkUpdateStatus(productIds: string[], status: string): Promise<void> {
    await api.patch('/products/bulk/status', { productIds, status });
  },

  // Bulk Delete Products (Admin)
  async bulkDelete(productIds: string[]): Promise<void> {
    await api.delete('/products/bulk', { data: { productIds } });
  },
};
