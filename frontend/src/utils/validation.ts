import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-]+$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Registration form validation
export const registerStep1Schema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const registerStep2Schema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  phone: phoneSchema,
});

// Combined registration schema
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().default(false),
});

export const registerStep3Schema = z.object({
  skipAddress: z.boolean(),
  address: addressSchema.optional(),
});

// Product form validation
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must be less than 200 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),
  price: z.number().positive('Price must be a positive number'),
  compareAtPrice: z.number().positive('Compare at price must be positive').optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  inventory: z.object({
    quantity: z.number().int().min(0, 'Quantity cannot be negative'),
    lowStockThreshold: z.number().int().min(0).default(10),
    trackInventory: z.boolean().default(true),
  }),
  status: z.enum(['active', 'draft', 'archived']),
  tags: z.array(z.string()).default([]),
  attributes: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .default([]),
});

// Category form validation
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  parentCategory: z.string().optional(),
});

// Checkout form validation
export const checkoutSchema = z
  .object({
    shippingAddress: addressSchema,
    sameAsShipping: z.boolean(),
    billingAddress: addressSchema.optional(),
    paymentMethod: z.enum(['card', 'paypal', 'cod']),
  })
  .refine(
    (data) => {
      if (!data.sameAsShipping) {
        return data.billingAddress !== undefined;
      }
      return true;
    },
    {
      message: 'Billing address is required',
      path: ['billingAddress'],
    }
  );

// Change password validation
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// Profile update validation
export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: phoneSchema,
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterStep1Data = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>;
export type AddressData = z.infer<typeof addressSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
