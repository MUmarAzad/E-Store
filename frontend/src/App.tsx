import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchProfile, refreshToken } from '@/store/slices/authSlice';
import { fetchCart } from '@/store/slices/cartSlice';
import { MainLayout, AuthLayout, AdminLayout } from '@/components/layout';
import {
  HomePage,
  ProductsPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  OrdersPage,
  OrderDetailPage,
  ProfilePage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  NotFoundPage,
} from '@/pages';
import {
  Dashboard,
  ProductManagement,
  OrderManagement,
  UserManagement,
} from '@/components/admin';
import { Loading } from '@/components/common';
import { ROUTES } from '@/utils/constants';
import { getStoredTokens } from '@/services/api';
import socketService from '@/services/socket.service';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
}) => {
  const { isAuthenticated, user, isLoading } = useAppSelector(
    (state) => state.auth
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};

// Guest Route Component (only for non-authenticated users)
interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check for stored tokens and attempt to restore session
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      dispatch(refreshToken())
        .unwrap()
        .then(() => {
          dispatch(fetchProfile());
        })
        .catch(() => {
          // Token refresh failed, user will need to login again
        });
    }
  }, [dispatch]);

  useEffect(() => {
    // Fetch cart when authenticated
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Connect to socket when authenticated
    if (isAuthenticated && user?._id) {
      socketService.connect(user._id);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path={ROUTES.LOGIN}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.RESET_PASSWORD}
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />
      </Route>

      {/* Main Routes */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path={`${ROUTES.PRODUCTS}/:slug`} element={<ProductDetailPage />} />
        
        {/* Protected Routes */}
        <Route
          path={ROUTES.CART}
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CHECKOUT}
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ORDERS}
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.ORDERS}/:id`}
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute requireAuth requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="orders/:id" element={<OrderManagement />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
