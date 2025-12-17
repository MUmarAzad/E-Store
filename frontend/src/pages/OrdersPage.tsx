import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { Card, Badge, Loading, EmptyState, Pagination } from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';

const OrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, isLoading, pagination } = useAppSelector(
    (state) => state.orders
  );
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders({}));
  }, [dispatch]);

  // Filter orders based on showCancelled toggle
  const filteredOrders = useMemo(() => {
    if (showCancelled) {
      return orders;
    }
    return orders.filter(order => order.status !== 'cancelled');
  }, [orders, showCancelled]);

  // Count cancelled orders
  const cancelledCount = useMemo(() => {
    return orders.filter(order => order.status === 'cancelled').length;
  }, [orders]);

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

  const handlePageChange = (_page: number) => {
    dispatch(fetchOrders({}));
  };

  // Handle image URL - support both string and object formats
  const getImageUrl = (image: string | { url: string } | undefined): string | null => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    return image.url || null;
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-16 w-16 text-gray-300" />}
        title="No orders yet"
        description="When you place orders, they will appear here."
        action={
          <Link to={ROUTES.PRODUCTS}>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Start Shopping
            </button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

        {/* Show cancelled orders toggle */}
        {cancelledCount > 0 && (
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showCancelled
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {showCancelled ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Cancelled ({cancelledCount})
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Cancelled ({cancelledCount})
              </>
            )}
          </button>
        )}
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active orders to display.</p>
          <button
            onClick={() => setShowCancelled(true)}
            className="mt-3 text-primary-600 hover:text-primary-700 text-sm"
          >
            Show cancelled orders ({cancelledCount})
          </button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order._id} className={`p-6 ${order.status === 'cancelled' ? 'opacity-75' : ''}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${order.status === 'cancelled' ? 'bg-red-50' : 'bg-gray-100'}`}>
                    <Package className={`h-6 w-6 ${order.status === 'cancelled' ? 'text-red-400' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {order.orderNumber}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} item(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {formatCurrency(order.pricing?.total || 0)}
                    </p>
                  </div>
                  <Link
                    to={`${ROUTES.ORDERS}/${order._id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {order.items.slice(0, 4).map((item, index) => {
                    const imageUrl = getImageUrl(item.image);
                    return (
                      <div
                        key={index}
                        className={`w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 ${order.status === 'cancelled' ? 'grayscale' : ''}`}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {order.items.length > 4 && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm text-gray-600">
                        +{order.items.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default OrdersPage;
