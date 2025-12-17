import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchOrderById, cancelOrder } from '@/store/slices/ordersSlice';
import { Card, Badge, Loading, EmptyState, Alert, Button, Modal } from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const dispatch = useAppDispatch();
  const { selectedOrder: order, isLoading, error } = useAppSelector(
    (state) => state.orders
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id]);

  const handleCancelOrder = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelOrder(id)).unwrap();
      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelOrder = order && ['pending', 'confirmed', 'processing'].includes(order.status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <EmptyState
        title="Order not found"
        description="The order you're looking for doesn't exist."
        action={
          <Link to={ROUTES.ORDERS}>
            <button className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
              <ArrowLeft className="h-5 w-5" />
              Back to Orders
            </button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {isSuccess && (
        <Alert
          type="success"
          message="Your order has been placed successfully! You will receive a confirmation email shortly."
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.ORDERS}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order.orderNumber}
            </h1>
            <p className="text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          {canCancelOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Ban className="h-4 w-4 mr-1" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
            >
              Keep Order
            </Button>
            <Button
              variant="primary"
              onClick={handleCancelOrder}
              isLoading={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Progress */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Order Status</h2>
        <div className="flex items-center justify-between">
          {['pending', 'processing', 'shipped', 'delivered'].map(
            (status, index) => (
              <React.Fragment key={status}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === status
                      ? 'bg-primary-100'
                      : ['pending', 'processing', 'shipped', 'delivered'].indexOf(
                        order.status
                      ) >= index
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                      }`}
                  >
                    {getStatusIcon(
                      ['pending', 'processing', 'shipped', 'delivered'].indexOf(
                        order.status
                      ) >= index
                        ? status
                        : 'pending'
                    )}
                  </div>
                  <span className="text-sm mt-2 capitalize">{status}</span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${['pending', 'processing', 'shipped', 'delivered'].indexOf(
                      order.status
                    ) > index
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                      }`}
                  />
                )}
              </React.Fragment>
            )
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b">
              <h2 className="font-semibold text-gray-900">Order Items</h2>
            </div>
            <div className="divide-y">
              {order.items.map((item, index) => (
                <div key={index} className="p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={typeof item.image === 'string' ? item.image : item.image.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shipping Address */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-primary-600" />
              Shipping Address
            </h3>
            <p className="text-gray-600 text-sm">
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.zipCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </Card>

          {/* Payment Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-primary-600" />
              Payment Method
            </h3>
            <p className="text-gray-600 text-sm capitalize">
              {order.payment?.method || 'Card'}
            </p>
            <Badge
              variant={
                order.payment?.status === 'completed' ? 'success' : 'warning'
              }
              className="mt-2"
            >
              {order.payment?.status || 'Pending'}
            </Badge>
          </Card>

          {/* Order Totals */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(order.pricing?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {(order.pricing?.shipping || 0) > 0
                    ? formatCurrency(order.pricing?.shipping || 0)
                    : 'Free'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(order.pricing?.tax || 0)}</span>
              </div>
              {(order.pricing?.discount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.pricing?.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.pricing?.total || 0)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
