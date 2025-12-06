import React from 'react';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Badge } from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  iconBg,
  iconColor,
}) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change !== undefined && (
          <div className="flex items-center mt-2">
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  // Mock data - in real app, this would come from API
  const stats = {
    totalRevenue: 45678.9,
    revenueChange: 12.5,
    totalOrders: 1234,
    ordersChange: 8.2,
    totalProducts: 156,
    productsChange: 4.1,
    totalCustomers: 892,
    customersChange: 15.3,
  };

  const recentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customer: 'John Doe',
      total: 156.99,
      status: 'pending',
      date: new Date().toISOString(),
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      customer: 'Jane Smith',
      total: 289.5,
      status: 'processing',
      date: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      customer: 'Bob Johnson',
      total: 75.0,
      status: 'shipped',
      date: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      orderNumber: 'ORD-004',
      customer: 'Alice Brown',
      total: 432.25,
      status: 'delivered',
      date: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const topProducts = [
    { name: 'Wireless Headphones', sales: 234, revenue: 23400 },
    { name: 'Smart Watch Pro', sales: 189, revenue: 37800 },
    { name: 'Laptop Stand', sales: 156, revenue: 7800 },
    { name: 'USB-C Hub', sales: 145, revenue: 5800 },
    { name: 'Mechanical Keyboard', sales: 123, revenue: 14760 },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          change={stats.ordersChange}
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          change={stats.productsChange}
          icon={Package}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          change={stats.customersChange}
          icon={Users}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link
                to={ROUTES.ADMIN_ORDERS}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.date)}
                    </p>
                  </div>
                </div>
                <div className="mt-2">{getStatusBadge(order.status)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Top Products</h2>
              <Link
                to={ROUTES.ADMIN_PRODUCTS}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {topProducts.map((product, index) => (
              <div key={product.name} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} sales</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
