// Order status colors and labels
export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
} as const;

// Payment status colors
export const PAYMENT_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
} as const;

// Product status
export const PRODUCT_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  archived: { label: 'Archived', color: 'bg-red-100 text-red-800' },
} as const;

// User roles
export const USER_ROLES = {
  customer: { label: 'Customer', color: 'bg-blue-100 text-blue-800' },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  vendor: { label: 'Vendor', color: 'bg-orange-100 text-orange-800' },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  LIMITS: [12, 24, 48, 96],
} as const;

// Sort options
export const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'name:asc', label: 'Name: A to Z' },
  { value: 'name:desc', label: 'Name: Z to A' },
  { value: 'ratings.average:desc', label: 'Highest Rated' },
] as const;

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card', icon: 'CreditCard' },
  { value: 'paypal', label: 'PayPal', icon: 'Wallet' },
  { value: 'cod', label: 'Cash on Delivery', icon: 'Banknote' },
] as const;

// Countries list (simplified)
export const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'PK', label: 'Pakistan' },
] as const;

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGES: 10,
} as const;

// API routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    LOGOUT: '/users/logout',
    REFRESH: '/users/refresh-token',
    PROFILE: '/users/profile',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    CATEGORIES: '/categories',
  },
  CART: {
    GET: '/cart',
    ADD: '/cart/items',
    UPDATE: (productId: string) => `/cart/items/${productId}`,
    REMOVE: (productId: string) => `/cart/items/${productId}`,
    CLEAR: '/cart',
  },
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },
  ADMIN: {
    ORDERS: '/admin/orders',
    USERS: '/admin/users',
    ANALYTICS: '/admin/analytics',
  },
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  PROFILE: '/profile',
  ORDER_CONFIRMATION: (id: string) => `/orders/${id}/confirmation`,
  ACCOUNT: {
    DASHBOARD: '/account',
    PROFILE: '/account/profile',
    ORDERS: '/account/orders',
    ORDER_DETAIL: (id: string) => `/account/orders/${id}`,
    ADDRESSES: '/account/addresses',
  },
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_NEW: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: (id: string) => `/admin/products/${id}/edit`,
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: (id: string) => `/admin/orders/${id}`,
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
} as const;
