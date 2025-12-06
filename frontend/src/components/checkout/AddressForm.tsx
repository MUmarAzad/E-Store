import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';
import { Input, Select, Button } from '@/components/common';
import { addressSchema } from '@/utils/validation';
import type { Address } from '@/types';

interface AddressFormProps {
  defaultValues?: Partial<Address>;
  onSubmit: (data: Address) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const AddressForm: React.FC<AddressFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Address',
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      isDefault: false,
      ...defaultValues,
    },
  });

  const countries = [
    { value: 'United States', label: 'United States' },
    { value: 'Canada', label: 'Canada' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Pakistan', label: 'Pakistan' },
    { value: 'India', label: 'India' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-2 text-primary-600 mb-4">
        <MapPin className="h-5 w-5" />
        <h3 className="font-semibold">Shipping Address</h3>
      </div>

      <Input
        label="Street Address"
        placeholder="123 Main Street"
        error={errors.street?.message}
        {...register('street')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="City"
          placeholder="New York"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="State / Province"
          placeholder="NY"
          error={errors.state?.message}
          {...register('state')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="ZIP / Postal Code"
          placeholder="10001"
          error={errors.zipCode?.message}
          {...register('zipCode')}
        />
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <Select
              label="Country"
              options={countries}
              value={field.value}
              onChange={field.onChange}
              error={errors.country?.message}
            />
          )}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          {...register('isDefault')}
        />
        <span className="text-sm text-gray-600">Set as default address</span>
      </label>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
