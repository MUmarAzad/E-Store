import api from './api';
import { User, PaginatedResponse } from '@/types';

interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export const userService = {
  // Get All Users (Admin)
  async getUsers(params: UserQueryParams = {}): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params });
    return response.data;
  },

  // Get User by ID (Admin)
  async getUserById(id: string): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>(`/admin/users/${id}`);
    return response.data.data;
  },

  // Update User Role (Admin)
  async updateUserRole(id: string, role: string): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(`/admin/users/${id}/role`, {
      role,
    });
    return response.data.data;
  },

  // Toggle User Status (Admin)
  async toggleUserStatus(id: string): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(
      `/admin/users/${id}/toggle-status`
    );
    return response.data.data;
  },

  // Delete User (Admin)
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  // Get User Statistics (Admin)
  async getUserStats(): Promise<{
    total: number;
    customers: number;
    admins: number;
    vendors: number;
    newThisMonth: number;
  }> {
    const response = await api.get<{
      success: boolean;
      data: {
        total: number;
        customers: number;
        admins: number;
        vendors: number;
        newThisMonth: number;
      };
    }>('/admin/users/stats');
    return response.data.data;
  },

  // Update User (Admin)
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(`/admin/users/${id}`, data);
    return response.data.data;
  },
};

export default userService;
