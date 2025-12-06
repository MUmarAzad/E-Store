export { default as authReducer } from './authSlice';
export { default as productsReducer } from './productsSlice';
export { default as cartReducer } from './cartSlice';
export { default as ordersReducer } from './ordersSlice';
export { default as uiReducer } from './uiSlice';

// Re-export actions with explicit names to avoid conflicts
export {
  login,
  register,
  logout,
  refreshToken,
  fetchProfile,
  updateProfile,
  clearError as clearAuthError,
  setTokens,
  setUser,
  resetAuth,
} from './authSlice';

export {
  fetchProducts,
  fetchProductBySlug,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  setFilters,
  clearFilters,
  setSort,
  setPage as setProductsPage,
  setLimit as setProductsLimit,
  clearSelectedProduct,
  clearError as clearProductsError,
} from './productsSlice';

export {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
  setCart,
  clearCartState,
  setSyncing,
  clearError as clearCartError,
} from './cartSlice';

export {
  fetchOrders,
  fetchOrderById,
  createOrder,
  fetchAllOrders,
  updateOrderStatus,
  setPage as setOrdersPage,
  setLimit as setOrdersLimit,
  clearSelectedOrder,
  clearError as clearOrdersError,
} from './ordersSlice';

export {
  toggleSidebar,
  setSidebarOpen,
  toggleCartSidebar,
  setCartSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setTheme,
  toggleTheme,
  addNotification,
  removeNotification,
  clearNotifications,
} from './uiSlice';
