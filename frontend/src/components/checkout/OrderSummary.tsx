import React from 'react';
import { ShoppingBag, Tag, Truck } from 'lucide-react';
import { useAppSelector } from '@/hooks';
import { formatCurrency } from '@/utils/helpers';
import { Skeleton } from '@/components/common';

interface OrderSummaryProps {
  showItems?: boolean;
  shipping?: number;
  discount?: number;
  tax?: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  showItems = true,
  shipping = 0,
  discount = 0,
  tax,
}) => {
  const { cart, isLoading } = useAppSelector((state) => state.cart);

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-16 h-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  // Calculate tax: default 8% if not provided (matches backend)
  const taxAmount = tax !== undefined ? tax : subtotal * 0.08;
  const total = subtotal + shipping + taxAmount - discount;

  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <ShoppingBag className="h-5 w-5" />
        Order Summary
      </h3>

      {/* Items */}
      {showItems && (
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {item.product?.images?.[0] ? (
                  <img
                    src={typeof item.product.images[0] === 'string'
                      ? item.product.images[0]
                      : item.product.images[0].url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {item.product?.name || 'Product'}
                </h4>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({cart.items.length} items)</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            Shipping
          </span>
          <span>{shipping > 0 ? formatCurrency(shipping) : 'Free'}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Discount
            </span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Tax (8%)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>

        <div className="flex justify-between text-lg font-semibold pt-2 border-t">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Free Shipping Notice */}
      {subtotal < 50 && (
        <div className="bg-primary-50 text-primary-700 text-sm p-3 rounded-lg">
          Add {formatCurrency(50 - subtotal)} more to get free shipping!
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
