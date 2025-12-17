import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    Calendar,
    Download,
    Filter
} from 'lucide-react';
import { Card, Loading, Button } from '@/components/common';
import { analyticsService } from '@/services';
import type { SalesDataPoint, TopProduct, DashboardMetrics } from '@/services/analytics.service';
import { formatCurrency } from '@/utils/helpers';
import { SalesChart, OrderStatusChart, RevenueByProductChart } from './charts';
import toast from 'react-hot-toast';

const Analytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

    const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                const [salesRes, productsRes, metricsRes] = await Promise.all([
                    analyticsService.getSalesAnalytics({ groupBy, startDate: undefined, endDate: undefined }), // In a real app we'd calculate dates based on period
                    analyticsService.getTopProducts({ limit: 10, period }),
                    analyticsService.getDashboardMetrics(period)
                ]);

                setSalesData(salesRes.sales);
                setTopProducts(productsRes.products);
                setMetrics(metricsRes.metrics);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                toast.error('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [period, groupBy]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Loading size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
                    <p className="text-gray-500 mt-1">Detailed insights into your store performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="1y">Last Year</option>
                        </select>
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {metrics ? formatCurrency(metrics.revenue.total) : '-'}
                            </h3>
                            <div className="flex items-center mt-1 text-sm">
                                <span className={`flex items-center ${parseFloat(metrics?.revenue.change || '0') >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    {metrics?.revenue.change}%
                                </span>
                                <span className="text-gray-500 ml-1">vs last period</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {metrics?.orders.total.toLocaleString()}
                            </h3>
                            <div className="flex items-center mt-1 text-sm">
                                <span className={`flex items-center ${parseFloat(metrics?.orders.change || '0') >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    {metrics?.orders.change}%
                                </span>
                                <span className="text-gray-500 ml-1">vs last period</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {metrics ? formatCurrency(metrics.avgOrderValue.value) : '-'}
                            </h3>
                            <div className="flex items-center mt-1 text-sm">
                                <span className={`flex items-center ${parseFloat(metrics?.avgOrderValue.change || '0') >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    {metrics?.avgOrderValue.change}%
                                </span>
                                <span className="text-gray-500 ml-1">vs last period</span>
                            </div>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Filter className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Order Success Rate</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {metrics ?
                                    Math.round(((metrics.statusBreakdown.delivered || 0) / metrics.orders.total) * 100 || 0)
                                    : 0}%
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Based on delivered orders</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <Users className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Sales Chart */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Revenue & Orders Over Time</h2>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={groupBy === 'day' ? 'primary' : 'outline'}
                            onClick={() => setGroupBy('day')}
                        >
                            Daily
                        </Button>
                        <Button
                            size="sm"
                            variant={groupBy === 'week' ? 'primary' : 'outline'}
                            onClick={() => setGroupBy('week')}
                        >
                            Weekly
                        </Button>
                        <Button
                            size="sm"
                            variant={groupBy === 'month' ? 'primary' : 'outline'}
                            onClick={() => setGroupBy('month')}
                        >
                            Monthly
                        </Button>
                    </div>
                </div>
                <div className="h-[400px]">
                    {salesData.length > 0 ? (
                        <SalesChart data={salesData} groupBy={groupBy} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">No data available for this range</div>
                    )}
                </div>
            </Card>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status Distribution</h2>
                    <div className="h-[300px]">
                        {metrics && Object.keys(metrics.statusBreakdown).length > 0 ? (
                            <OrderStatusChart data={metrics.statusBreakdown} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue by Top Products</h2>
                    <div className="h-[300px]">
                        {topProducts.length > 0 ? (
                            <RevenueByProductChart data={topProducts.slice(0, 5)} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Top Products Table */}
            <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Top Performing Products</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Product Name</th>
                                <th className="px-6 py-4">Units Sold</th>
                                <th className="px-6 py-4">Revenue</th>
                                <th className="px-6 py-4">Avg. Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topProducts.map((product) => (
                                <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.totalQuantity} units
                                    </td>
                                    <td className="px-6 py-4 text-green-600 font-medium">
                                        {formatCurrency(product.totalRevenue)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatCurrency(product.avgPrice)}
                                    </td>
                                </tr>
                            ))}
                            {topProducts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        No product performance data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
};

export default Analytics;
