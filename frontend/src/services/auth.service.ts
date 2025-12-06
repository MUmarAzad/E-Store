import api from './api';
import { 
  User, 
  LoginFormData, 
  RegisterFormData, 
  LoginResponse, 
  RefreshTokenResponse,
  Address
} from '@/types';

export const authService = {
  // Login
  async login(data: LoginFormData): Promise<LoginResponse> {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', data);
    return response.data.data;
  },

  // Register
  async register(data: RegisterFormData): Promise<LoginResponse> {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/register', data);
    return response.data.data;
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // Refresh Token
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await api.post<{ success: boolean; data: RefreshTokenResponse }>(
      '/auth/refresh-token',
      { refreshToken }
    );
    return response.data.data;
  },

  // Get Profile
  async getProfile(): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>('/users/profile');
    return response.data.data;
  },

  // Update Profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>('/users/profile', data);
    return response.data.data;
  },

  // Change Password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/users/password', { currentPassword, newPassword });
  },

  // Forgot Password
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  // Reset Password
  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  // Add Address
  async addAddress(address: Omit<Address, '_id'>): Promise<User> {
    const response = await api.post<{ success: boolean; data: User }>('/users/addresses', address);
    return response.data.data;
  },

  // Update Address
  async updateAddress(addressId: string, address: Partial<Address>): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(
      `/users/addresses/${addressId}`,
      address
    );
    return response.data.data;
  },

  // Delete Address
  async deleteAddress(addressId: string): Promise<User> {
    const response = await api.delete<{ success: boolean; data: User }>(
      `/users/addresses/${addressId}`
    );
    return response.data.data;
  },

  // Set Default Address
  async setDefaultAddress(addressId: string): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(
      `/users/addresses/${addressId}/default`
    );
    return response.data.data;
  },

  // Upload Avatar
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ success: boolean; data: User }>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};

export default authService;
