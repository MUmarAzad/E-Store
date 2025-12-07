import React, { useEffect, useState } from 'react';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Badge, Loading } from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import { analyticsService } from '@/services';
import type { DashboardMetrics, TopProduct, RecentOrder, LowStockProduct, SalesDataPoint } from '@/services/analytics.service';
import toast from 'react-hot-toast';
import { SalesChart, OrderStatusChart, RevenueByProductChart } from './charts';

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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [salesGroupBy, setSalesGroupBy] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, ordersData, productsData, lowStockData, salesAnalytics] = await Promise.all([
        analyticsService.getDashboardMetrics(period),
        analyticsService.getRecentOrders(5),
        analyticsService.getTopProducts({ limit: 5, period }),
        analyticsService.getLowStockProducts(),
        analyticsService.getSalesAnalytics({ groupBy: salesGroupBy }),
      ]);

      setMetrics(metricsData.metrics);
      setRecentOrders(ordersData.orders);
      setTopProducts(productsData.products);
      setLowStockProducts(lowStockData.products);
      setSalesData(salesAnalytics.sales);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={metrics ? formatCurrency(metrics.revenue.total) : '$0'}
          change={metrics ? parseFloat(metrics.revenue.change) : 0}
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Orders"
          value={metrics ? metrics.orders.total.toLocaleString() : '0'}
          change={metrics ? parseFloat(metrics.orders.change) : 0}
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Avg Order Value"
          value={metrics ? formatCurrency(metrics.avgOrderValue.value) : '$0'}
          change={metrics ? parseFloat(metrics.avgOrderValue.change) : 0}
          icon={Package}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length.toLocaleString()}
          icon={AlertTriangle}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Low Stock Alert</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {lowStockProducts.length} product(s) are running low on stock.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <span key={product._id} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                      {product.name} ({product.inventory.quantity} left)
                    </span>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <span className="text-xs text-orange-600">
                      +{lowStockProducts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={ROUTES.ADMIN_PRODUCTS}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Sales & Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sales Trend</h2>
              <select
                value={salesGroupBy}
                onChange={(e) => setSalesGroupBy(e.target.value as 'day' | 'week' | 'month')}
                className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            {salesData.length > 0 ? (
              <SalesChart data={salesData} groupBy={salesGroupBy} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>No sales data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Order Status Breakdown Chart */}
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Order Status Distribution</h2>
          </div>
          <div className="p-6">
            {metrics && Object.keys(metrics.statusBreakdown).length > 0 ? (
              <OrderStatusChart data={metrics.statusBreakdown} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>No order data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Revenue by Product Chart */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Revenue by Top Products</h2>
          </div>
          <div className="p-6">
            {topProducts.length > 0 ? (
              <RevenueByProductChart data={topProducts} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>No product data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link
                to={`${ROUTES.ADMIN}/orders`}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No orders yet</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.user.firstName} {order.user.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.pricing.total)}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">{getStatusBadge(order.status)}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Top Products</h2>
              <Link
                to={`${ROUTES.ADMIN}/products`}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No sales data yet</p>
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.productId} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.totalQuantity} sold</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
