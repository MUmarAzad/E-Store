import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { updateCartItem, removeFromCart, clearCart } from '@/store/slices/cartSlice';
import { Button, Card, EmptyState, Loading } from '@/components/common';
import { OrderSummary } from '@/components/checkout';
import { formatCurrency } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';

const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cart, isLoading, isSyncing } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleUpdateQuantity = (productId: string, quantity: number, maxStock?: number) => {
    if (quantity < 1) return;
    if (maxStock && quantity > maxStock) {
      // Optionally show a toast notification
      return;
    }
    dispatch(updateCartItem({ productId, quantity }));
  };

  const handleRemove = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-16 w-16 text-gray-300" />}
        title="Please log in"
        description="You need to be logged in to view your cart."
        action={
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary">Login</Button>
          </Link>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-16 w-16 text-gray-300" />}
        title="Your cart is empty"
        description="Looks like you haven't added any items to your cart yet."
        action={
          <Link to={ROUTES.PRODUCTS}>
            <Button variant="primary">
              Start Shopping
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <Button variant="ghost" onClick={handleClearCart} disabled={isSyncing}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <Card key={item.productId} className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div>
                      <Link
                        to={`${ROUTES.PRODUCTS}/${item.product?.slug}`}
                        className="font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {item.product?.name || 'Product'}
                      </Link>
                      {item.product?.category && (
                        <p className="text-sm text-gray-500 mt-1">
                          {typeof item.product.category === 'object' ? item.product.category.name : item.product.category}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={isSyncing}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.productId, item.quantity - 1, item.product?.stock)
                        }
                        disabled={isSyncing || item.quantity <= 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.productId, item.quantity + 1, item.product?.stock)
                        }
                        disabled={isSyncing || (item.product?.stock !== undefined && item.quantity >= item.product.stock)}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={item.product?.stock !== undefined && item.quantity >= item.product.stock ? 'Maximum stock reached' : ''}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <OrderSummary showItems={false} />
            <Link to={ROUTES.CHECKOUT}>
              <Button variant="primary" fullWidth size="lg">
                Proceed to Checkout
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link
              to={ROUTES.PRODUCTS}
              className="block text-center text-gray-600 hover:text-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
