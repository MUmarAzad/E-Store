import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  ChevronLeft,
  Menu,
  LogOut,
  Bell
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { logout, toggleSidebar, clearNotifications, removeNotification } from '@/store/slices';
import { Avatar, Button } from '@/components/common';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';

const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen, notifications } = useAppSelector((state) => state.ui);

  const navItems = [
    { path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { path: ROUTES.ADMIN_PRODUCTS, icon: Package, label: 'Products' },
    { path: ROUTES.ADMIN_CATEGORIES, icon: FolderTree, label: 'Categories' },
    { path: ROUTES.ADMIN_ORDERS, icon: ShoppingCart, label: 'Orders' },
    { path: ROUTES.ADMIN_USERS, icon: Users, label: 'Users' },
  ];

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {sidebarOpen && (
            <span className="text-xl font-bold text-primary-600">E-Store Admin</span>
          )}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            ) : (
              <Menu className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100',
                  !sidebarOpen && 'justify-center'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
            <Avatar
              src={user?.avatar}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="sm"
            />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => dispatch(clearNotifications())}
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Notifications Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden hidden group-hover:block z-50">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-medium text-gray-900 text-sm">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => dispatch(clearNotifications())}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice().reverse().map((notification) => (
                      <div key={notification.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${notification.type === 'error' ? 'bg-red-50/50' :
                        notification.type === 'success' ? 'bg-green-50/50' :
                          notification.type === 'warning' ? 'bg-yellow-50/50' : ''
                        }`}>
                        {notification.title && <p className="font-medium text-sm text-gray-900 mb-0.5">{notification.title}</p>}
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(removeNotification(notification.id));
                          }}
                          className="mt-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                          Dismiss
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.HOME)}>
              View Store
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
