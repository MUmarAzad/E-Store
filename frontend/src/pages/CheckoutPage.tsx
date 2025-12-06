import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAppSelector } from '@/hooks';
import { EmptyState, Button } from '@/components/common';
import { CheckoutForm } from '@/components/checkout';
import { ROUTES } from '@/utils/constants';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { cart } = useAppSelector((state) => state.cart);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.CHECKOUT } });
    }
  }, [isAuthenticated, navigate]);

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-16 w-16 text-gray-300" />}
        title="Your cart is empty"
        description="Add some items to your cart before checking out."
        action={
          <Link to={ROUTES.PRODUCTS}>
            <Button variant="primary">Start Shopping</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.CART}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      <CheckoutForm />
    </div>
  );
};

export default CheckoutPage;
