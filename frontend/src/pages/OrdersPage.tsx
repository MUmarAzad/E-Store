import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye } from 'lucide-react';
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

  useEffect(() => {
    dispatch(fetchOrders({}));
  }, [dispatch]);

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

  const handlePageChange = (_page: number) => {
    dispatch(fetchOrders({}));
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
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order._id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="h-6 w-6 text-gray-600" />
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
                  <p className="text-lg font-bold text-gray-900">
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
                {order.items.slice(0, 4).map((item, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
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
