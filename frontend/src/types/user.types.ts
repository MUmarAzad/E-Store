// ===================================
// User Types
// ===================================

export interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export type UserRole = 'customer' | 'admin' | 'vendor';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  isActive?: boolean;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Registration form data
export interface RegisterStep1Data {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterStep2Data {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterStep3Data {
  address?: Address;
  skipAddress: boolean;
}

export interface RegisterFormData extends RegisterStep1Data, RegisterStep2Data {
  address?: Address;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}
