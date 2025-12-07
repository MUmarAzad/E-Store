/**
 * Shared Zod Validation Schemas
 * These schemas can be used on both frontend (React) and backend (Node.js)
 * 
 * Installation: npm install zod
 */

const { z } = require('zod');

// ============================================
// Common Validators
// ============================================

/**
 * MongoDB ObjectId validator
 */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

/**
 * Pagination query params
 */
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

/**
 * Common sort options
 */
const sortSchema = z.string().optional().default('-createdAt');

// ============================================
// User Schemas
// ============================================

/**
 * User Registration Schema
 */
const userRegistrationSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

/**
 * User Login Schema
 */
const userLoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

/**
 * User Profile Update Schema
 */
const userProfileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

/**
 * Password Change Schema
 */
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

/**
 * Reset Password Schema (for forgot password flow)
 */
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * Refresh Token Schema
 */
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// Address Schemas
// ============================================

/**
 * Address Schema
 */
const addressSchema = z.object({
  label: z.string().max(50).default('Home').optional(),
  street: z.string().min(5, 'Street address is required').max(200).trim(),
  city: z.string().min(2, 'City is required').max(100).trim(),
  state: z.string().min(2, 'State is required').max(100).trim(),
  zipCode: z.string().min(3, 'Zip code is required').max(20).trim(),
  country: z.string().min(2, 'Country is required').max(100).default('Pakistan'),
  isDefault: z.boolean().default(false),
});

// ============================================
// Product Schemas
// ============================================

/**
 * Product Create/Update Schema
 */
const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name cannot exceed 200 characters')
    .trim(),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.number().positive('Price must be a positive number'),
  compareAtPrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  category: objectId,
  subcategory: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  inventory: z
    .object({
      quantity: z.number().int().min(0).default(0),
      lowStockThreshold: z.number().int().min(0).default(10),
      trackInventory: z.boolean().default(true),
      allowBackorder: z.boolean().default(false),
      sku: z.string().max(50).optional(),
    })
    .optional(),
  attributes: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        value: z.string().min(1).max(100),
      })
    )
    .optional(),
  tags: z.array(z.string().max(50)).optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  isFeatured: z.boolean().default(false),
  seo: z
    .object({
      metaTitle: z.string().max(70).optional(),
      metaDescription: z.string().max(160).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Product Update Schema (partial)
 */
const productUpdateSchema = productSchema.partial();

/**
 * Product Query Schema
 */
const productQuerySchema = paginationSchema.extend({
  category: objectId.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().max(200).optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  sort: z.string().optional(),
});

/**
 * Inventory Update Schema
 */
const inventoryUpdateSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  allowBackorder: z.boolean().optional(),
});

// ============================================
// Category Schemas
// ============================================

/**
 * Category Create Schema
 */
const categorySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z.string().min(2).max(100).trim().optional(), // Optional - auto-generated if not provided
  description: z.string().max(500).optional(),
  parent: objectId.optional().nullable(), // Changed from parentId to parent to match model
  image: z.string().url().optional().or(z.literal('')),
  icon: z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).optional().default(0), // Changed from order to sortOrder
  isActive: z.boolean().optional().default(true),
});

/**
 * Category Update Schema
 */
const categoryUpdateSchema = categorySchema.partial();

// ============================================
// Cart Schemas
// ============================================

/**
 * Add to Cart Schema
 */
const addToCartSchema = z.object({
  productId: objectId,
  quantity: z.number().int().positive().max(100, 'Maximum quantity is 100'),
});

/**
 * Update Cart Item Schema
 */
const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100, 'Maximum quantity is 100'),
});

/**
 * Apply Coupon Schema
 */
const applyCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase().trim(),
});

/**
 * Merge Cart Schema
 */
const mergeCartSchema = z.object({
  sessionId: z.string().min(1),
});

// ============================================
// Order Schemas
// ============================================

/**
 * Shipping Address Schema (for order)
 */
const orderAddressSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  street: z.string().min(5).max(200).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  zipCode: z.string().min(3).max(20).trim(),
  country: z.string().min(2).max(100).default('Pakistan'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Payment Schema
 */
const paymentSchema = z.object({
  method: z.enum(['credit_card', 'debit_card', 'paypal', 'cod', 'bank_transfer']),
  // Additional fields for card payment (for display purposes, not actual processing)
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
});

/**
 * Create Order (Checkout) Schema
 */
const createOrderSchema = z.object({
  shippingAddress: orderAddressSchema,
  billingAddress: orderAddressSchema.optional(),
  paymentMethod: z.enum(['card', 'cod']),
  paymentInfo: z.object({
    method: z.enum(['card', 'cod']),
    cardLast4: z.string().length(4).optional(),
    cardBrand: z.string().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Order Status Update Schema (Admin)
 */
const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  note: z.string().max(500).optional(),
  trackingNumber: z.string().max(100).optional(),
});

/**
 * Order Query Schema
 */
const orderQuerySchema = paginationSchema.extend({
  status: z
    .enum([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ])
    .optional(),
  search: z.string().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sort: z.string().optional(),
});

/**
 * Cancel Order Schema
 */
const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ============================================
// Admin Schemas
// ============================================

/**
 * Update User Role Schema
 */
const updateUserRoleSchema = z.object({
  role: z.enum(['customer', 'admin', 'vendor']),
});

/**
 * Update User Status Schema
 */
const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

/**
 * User Query Schema (Admin)
 */
const userQuerySchema = paginationSchema.extend({
  role: z.enum(['customer', 'admin', 'vendor']).optional(),
  search: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  sort: z.string().optional(),
});

/**
 * Analytics Query Schema
 */
const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

// ============================================
// Type Exports (for TypeScript)
// ============================================

/**
 * @typedef {z.infer<typeof userRegistrationSchema>} UserRegistration
 * @typedef {z.infer<typeof userLoginSchema>} UserLogin
 * @typedef {z.infer<typeof userProfileUpdateSchema>} UserProfileUpdate
 * @typedef {z.infer<typeof addressSchema>} Address
 * @typedef {z.infer<typeof productSchema>} Product
 * @typedef {z.infer<typeof productQuerySchema>} ProductQuery
 * @typedef {z.infer<typeof categorySchema>} Category
 * @typedef {z.infer<typeof addToCartSchema>} AddToCart
 * @typedef {z.infer<typeof createOrderSchema>} CreateOrder
 * @typedef {z.infer<typeof orderStatusUpdateSchema>} OrderStatusUpdate
 */

module.exports = {
  // Common
  objectId,
  paginationSchema,
  sortSchema,
  
  // User
  userRegistrationSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  passwordChangeSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  
  // Address
  addressSchema,
  
  // Product
  productSchema,
  productUpdateSchema,
  productQuerySchema,
  inventoryUpdateSchema,
  
  // Category
  categorySchema,
  categoryUpdateSchema,
  
  // Cart
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
  mergeCartSchema,
  
  // Order
  orderAddressSchema,
  paymentSchema,
  createOrderSchema,
  orderStatusUpdateSchema,
  orderQuerySchema,
  cancelOrderSchema,
  
  // Admin
  updateUserRoleSchema,
  updateUserStatusSchema,
  userQuerySchema,
  analyticsQuerySchema,
};
