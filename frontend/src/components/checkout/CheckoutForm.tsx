import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, CreditCard, Package } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { createOrder } from '@/store/slices/ordersSlice';
import { clearCart } from '@/store/slices/cartSlice';
import { Button, Alert } from '@/components/common';
import AddressForm from './AddressForm';
import PaymentForm from './PaymentForm';
import OrderSummary from './OrderSummary';
import { ROUTES } from '@/utils/constants';
import type { Address, CheckoutFormData } from '@/types';

const steps = [
  { id: 1, name: 'Shipping', icon: MapPin },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'Review', icon: Package },
];

const CheckoutForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading, error } = useAppSelector((state) => state.orders);

  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('cod');
  const [checkoutData, setCheckoutData] = useState<Partial<CheckoutFormData>>({
    shippingAddress: user?.addresses?.find((a) => a.isDefault) || undefined,
  });

  const handleAddressSubmit = (address: Address) => {
    setCheckoutData((prev) => ({ ...prev, shippingAddress: address }));
    setCurrentStep(2);
  };

  const handlePaymentSubmit = (paymentData: any) => {
    setCheckoutData((prev) => ({
      ...prev,
      paymentInfo: {
        method: 'card',
        cardLast4: paymentData.cardNumber.slice(-4),
      },
    }));
    setCurrentStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!cart || !checkoutData.shippingAddress) return;

    const orderData: CheckoutFormData = {
      shippingAddress: checkoutData.shippingAddress,
      paymentMethod: paymentMethod,
      paymentInfo: paymentMethod === 'card' 
        ? (checkoutData.paymentInfo || { method: 'card' })
        : { method: 'cod' },
    };

    const result = await dispatch(createOrder(orderData));
    if (createOrder.fulfilled.match(result)) {
      dispatch(clearCart());
      navigate(`${ROUTES.ORDERS}/${result.payload._id}?success=true`);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Steps */}
        <nav className="mb-8">
          <ol className="flex items-center">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    step.id === currentStep
                      ? 'text-primary-600'
                      : step.id < currentStep
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      step.id === currentStep
                        ? 'border-primary-600 bg-primary-50'
                        : step.id < currentStep
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="font-medium hidden sm:block">
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      step.id < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {error && (
          <Alert type="error" message={error} className="mb-6" />
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {currentStep === 1 && (
            <AddressForm
              defaultValues={checkoutData.shippingAddress}
              onSubmit={handleAddressSubmit}
              submitLabel="Continue to Payment"
            />
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Select Payment Method</h3>
              
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: paymentMethod === 'cod' ? '#667eea' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive your order</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: paymentMethod === 'card' ? '#667eea' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Secure payment with Stripe (Coming Soon)</div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'card' && (
                <div className="mt-4">
                  <PaymentForm onSubmit={handlePaymentSubmit} />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={goBack}
                >
                  ← Back to Shipping
                </Button>
                {paymentMethod === 'cod' && (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep(3)}
                  >
                    Continue to Review
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Review Your Order</h3>

              {/* Shipping Address */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    Shipping Address
                  </h4>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                </div>
                {checkoutData.shippingAddress && (
                  <p className="text-gray-600 text-sm">
                    {checkoutData.shippingAddress.street}
                    <br />
                    {checkoutData.shippingAddress.city},{' '}
                    {checkoutData.shippingAddress.state}{' '}
                    {checkoutData.shippingAddress.zipCode}
                    <br />
                    {checkoutData.shippingAddress.country}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary-600" />
                    Payment Method
                  </h4>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  {paymentMethod === 'cod' 
                    ? 'Cash on Delivery' 
                    : `Card ending in ${checkoutData.paymentInfo?.cardLast4 || '****'}`}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handlePlaceOrder}
                  isLoading={isLoading}
                >
                  Place Order
                </Button>
              </div>

              <button
                onClick={goBack}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
