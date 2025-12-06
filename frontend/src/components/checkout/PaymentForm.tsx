import React from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { Input, Button } from '@/components/common';

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = React.useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 16) {
      newErrors.cardNumber = 'Valid card number is required';
    }

    const expiry = formData.expiryDate.split('/');
    if (!formData.expiryDate || expiry.length !== 2) {
      newErrors.expiryDate = 'Valid expiry date is required';
    } else {
      const month = parseInt(expiry[0], 10);
      const year = parseInt('20' + expiry[1], 10);
      const now = new Date();
      const expDate = new Date(year, month - 1);
      if (month < 1 || month > 12 || expDate < now) {
        newErrors.expiryDate = 'Card has expired or invalid date';
      }
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Valid CVV is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 text-primary-600 mb-4">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-semibold">Payment Details</h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2 text-sm text-gray-600">
        <Lock className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <Input
        label="Cardholder Name"
        name="cardholderName"
        placeholder="John Doe"
        value={formData.cardholderName}
        onChange={handleChange}
        error={errors.cardholderName}
      />

      <Input
        label="Card Number"
        name="cardNumber"
        placeholder="1234 5678 9012 3456"
        value={formData.cardNumber}
        onChange={handleChange}
        error={errors.cardNumber}
        maxLength={19}
        leftIcon={<CreditCard className="h-5 w-5 text-gray-400" />}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Expiry Date"
          name="expiryDate"
          placeholder="MM/YY"
          value={formData.expiryDate}
          onChange={handleChange}
          error={errors.expiryDate}
          maxLength={5}
        />
        <Input
          label="CVV"
          name="cvv"
          placeholder="123"
          value={formData.cvv}
          onChange={handleChange}
          error={errors.cvv}
          maxLength={4}
          type="password"
        />
      </div>

      {/* Card Icons */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-sm text-gray-500">Accepted cards:</span>
        <div className="flex gap-2">
          <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
            VISA
          </div>
          <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
            MC
          </div>
          <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
            AMEX
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        isLoading={isLoading}
      >
        <Lock className="h-5 w-5 mr-2" />
        Complete Payment
      </Button>
    </form>
  );
};

export default PaymentForm;
