/**
 * Analytics Controller
 * Handles analytics and reporting endpoints
 */

const Order = require('../models/Order');
const axios = require('axios');
const { asyncHandler } = require('../../../../shared/utils');
const { success } = require('../../../../shared/utils/apiResponse');

/**
 * @desc    Get dashboard metrics
 * @route   GET /api/admin/analytics/metrics
 * @access  Private/Admin
 */
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  // Total Revenue
  const revenueResult = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.total' },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  const totalOrders = revenueResult[0]?.count || 0;

  // Previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - (now - startDate) / (1000 * 60 * 60 * 24));

  const prevRevenueResult = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: prevStartDate, $lt: startDate },
        status: { $nin: ['cancelled'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.total' },
        count: { $sum: 1 }
      }
    }
  ]);

  const prevRevenue = prevRevenueResult[0]?.total || 1;
  const prevOrders = prevRevenueResult[0]?.count || 1;

  // Calculate percentage changes
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const ordersChange = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

  // Average Order Value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const prevAvgOrderValue = prevOrders > 0 ? prevRevenue / prevOrders : 1;
  const avgOrderValueChange = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

  // Order Status Breakdown
  const statusBreakdown = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const metrics = {
    revenue: {
      total: totalRevenue,
      change: revenueChange.toFixed(2)
    },
    orders: {
      total: totalOrders,
      change: ordersChange.toFixed(2)
    },
    avgOrderValue: {
      value: avgOrderValue,
      change: avgOrderValueChange.toFixed(2)
    },
    statusBreakdown: statusBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };

  return success(res, { metrics, period });
});

/**
 * @desc    Get sales analytics (chart data)
 * @route   GET /api/admin/analytics/sales
 * @access  Private/Admin
 */
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  let groupFormat;
  switch (groupBy) {
    case 'hour':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        hour: { $hour: '$createdAt' }
      };
      break;
    case 'day':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      break;
    case 'week':
      groupFormat = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      break;
    case 'month':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      break;
    default:
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
  }

  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled'] }
      }
    },
    {
      $group: {
        _id: groupFormat,
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$pricing.total' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
    }
  ]);

  // Format data for charts
  const formattedData = salesData.map(item => ({
    date: formatDateLabel(item._id, groupBy),
    revenue: parseFloat(item.revenue.toFixed(2)),
    orders: item.orders,
    avgOrderValue: parseFloat(item.avgOrderValue.toFixed(2)),
    ...item._id
  }));

  return success(res, { sales: formattedData, startDate: start, endDate: end, groupBy });
});

/**
 * @desc    Get top products
 * @route   GET /api/admin/analytics/top-products
 * @access  Private/Admin
 */
const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10, period = '30d' } = req.query;

  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$productDetails.name',
        slug: '$productDetails.slug',
        image: { $arrayElemAt: ['$productDetails.images.url', 0] },
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1,
        avgPrice: { $divide: ['$totalRevenue', '$totalQuantity'] }
      }
    }
  ]);

  return success(res, { products: topProducts, period });
});

/**
 * @desc    Get recent orders
 * @route   GET /api/admin/analytics/recent-orders
 * @access  Private/Admin
 */
const getRecentOrders = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName email')
    .select('orderNumber user pricing.total status createdAt');

  return success(res, { orders: recentOrders });
});

/**
 * @desc    Get low stock products
 * @route   GET /api/admin/analytics/low-stock
 * @access  Private/Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  // Call product service to get low stock products
  const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
  
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/low-stock`, {
      params: { limit: 20 }
    });
    
    return success(res, { products: response.data.data || [] });
  } catch (error) {
    console.error('Error fetching low stock products:', error.message);
    // Return empty array if product service is unavailable
    return success(res, { products: [] });
  }
});

/**
 * Helper function to format date labels
 */
function formatDateLabel(dateObj, groupBy) {
  switch (groupBy) {
    case 'hour':
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')} ${String(dateObj.hour).padStart(2, '0')}:00`;
    case 'day':
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
    case 'week':
      return `${dateObj.year}-W${String(dateObj.week).padStart(2, '0')}`;
    case 'month':
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}`;
    default:
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
  }
}

module.exports = {
  getDashboardMetrics,
  getSalesAnalytics,
  getTopProducts,
  getRecentOrders,
  getLowStockProducts,
};
