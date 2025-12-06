const schemas = require('./validation');

// Group schemas by domain for easier imports
const userSchemas = {
  register: schemas.userRegistrationSchema,
  login: schemas.userLoginSchema,
  updateProfile: schemas.userProfileUpdateSchema,
  changePassword: schemas.passwordChangeSchema,
  refreshToken: schemas.refreshTokenSchema,
  forgotPassword: schemas.userLoginSchema.pick({ email: true }),
  resetPassword: schemas.passwordChangeSchema.pick({ newPassword: true }),
  address: schemas.addressSchema,
  addAddress: schemas.addressSchema,
  updateAddress: schemas.addressSchema.partial(),
  adminUpdateUser: schemas.updateUserRoleSchema,
};

const productSchemas = {
  create: schemas.productSchema,
  update: schemas.productUpdateSchema,
  query: schemas.productQuerySchema,
  inventory: schemas.inventoryUpdateSchema,
};

const categorySchemas = {
  create: schemas.categorySchema,
  update: schemas.categoryUpdateSchema,
};

const cartSchemas = {
  addItem: schemas.addToCartSchema,
  updateItem: schemas.updateCartItemSchema,
  applyCoupon: schemas.applyCouponSchema,
  merge: schemas.mergeCartSchema,
};

const orderSchemas = {
  create: schemas.createOrderSchema,
  updateStatus: schemas.orderStatusUpdateSchema,
  query: schemas.orderQuerySchema,
  cancel: schemas.cancelOrderSchema,
  address: schemas.orderAddressSchema,
  payment: schemas.paymentSchema,
};

const adminSchemas = {
  updateUserRole: schemas.updateUserRoleSchema,
  updateUserStatus: schemas.updateUserStatusSchema,
  userQuery: schemas.userQuerySchema,
  analyticsQuery: schemas.analyticsQuerySchema,
};

module.exports = {
  // Grouped schemas
  userSchemas,
  productSchemas,
  categorySchemas,
  cartSchemas,
  orderSchemas,
  adminSchemas,
  
  // Common
  objectId: schemas.objectId,
  paginationSchema: schemas.paginationSchema,
  sortSchema: schemas.sortSchema,
  
  // Also export individual schemas for backward compatibility
  ...schemas,
};
