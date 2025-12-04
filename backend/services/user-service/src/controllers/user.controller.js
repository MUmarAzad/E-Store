/**
 * User Controller
 * Handles user profile and address management
 */

const User = require('../models/User');
const { asyncHandler } = require('../../../../shared/utils');
const {
  success,
  created,
  noContent,
  badRequest,
  notFound,
  paginated,
} = require('../../../../shared/utils/apiResponse');
const {
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
} = require('../../../../shared/utils/pagination');

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFound(res, 'User not found');
  }

  return success(res, { user: user.toJSON() });
});

/**
 * @desc    Update current user profile
 * @route   PATCH /api/users/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
  const updates = {};

  // Only copy allowed fields
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    return notFound(res, 'User not found');
  }

  return success(res, { user: user.toJSON() }, 'Profile updated successfully');
});

/**
 * @desc    Change password
 * @route   PATCH /api/users/me/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return notFound(res, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return badRequest(res, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  return success(res, null, 'Password changed successfully');
});

/**
 * @desc    Delete account (soft delete)
 * @route   DELETE /api/users/me
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      isActive: false,
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${req.user.email}`, // Preserve email uniqueness
    },
    { new: true }
  );

  if (!user) {
    return notFound(res, 'User not found');
  }

  return success(res, null, 'Account deleted successfully');
});

// =============================================================================
// ADDRESS MANAGEMENT
// =============================================================================

/**
 * @desc    Get all addresses
 * @route   GET /api/users/me/addresses
 * @access  Private
 */
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');

  if (!user) {
    return notFound(res, 'User not found');
  }

  return success(res, { addresses: user.addresses });
});

/**
 * @desc    Add new address
 * @route   POST /api/users/me/addresses
 * @access  Private
 */
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFound(res, 'User not found');
  }

  // If this is the first address or marked as default, set as default
  if (user.addresses.length === 0 || req.body.isDefault) {
    // Unset other default addresses
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  const newAddress = user.addresses[user.addresses.length - 1];

  return created(res, { address: newAddress }, 'Address added successfully');
});

/**
 * @desc    Update address
 * @route   PATCH /api/users/me/addresses/:addressId
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFound(res, 'User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    return notFound(res, 'Address not found');
  }

  // Update address fields
  Object.assign(address, req.body);

  // If setting as default, unset others
  if (req.body.isDefault) {
    user.addresses.forEach((addr) => {
      if (addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
  }

  await user.save();

  return success(res, { address }, 'Address updated successfully');
});

/**
 * @desc    Delete address
 * @route   DELETE /api/users/me/addresses/:addressId
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFound(res, 'User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    return notFound(res, 'Address not found');
  }

  const wasDefault = address.isDefault;

  // Remove the address
  user.addresses.pull(addressId);

  // If deleted address was default, set first remaining as default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  return success(res, null, 'Address deleted successfully');
});

/**
 * @desc    Set default address
 * @route   PATCH /api/users/me/addresses/:addressId/default
 * @access  Private
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFound(res, 'User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    return notFound(res, 'Address not found');
  }

  // Unset all defaults and set this one
  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === addressId;
  });

  await user.save();

  return success(res, { address }, 'Default address updated successfully');
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * @desc    Get all users (admin)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const sort = parseSortParams(req.query.sort, ['createdAt', 'firstName', 'lastName', 'email']);
  
  const filterConfig = {
    role: { type: 'exact' },
    isActive: { type: 'boolean' },
    search: { type: 'search', field: 'email' },
  };
  const filter = parseFilterParams(req.query, filterConfig);

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return paginated(res, { data: users, page, limit, total });
});

/**
 * @desc    Get user by ID (admin)
 * @route   GET /api/users/:userId
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return notFound(res, 'User not found');
  }

  return success(res, { user: user.toJSON() });
});

/**
 * @desc    Update user (admin)
 * @route   PATCH /api/users/:userId
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'role', 'isActive'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    return notFound(res, 'User not found');
  }

  return success(res, { user: user.toJSON() }, 'User updated successfully');
});

/**
 * @desc    Delete user (admin)
 * @route   DELETE /api/users/:userId
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    {
      isActive: false,
      deletedAt: new Date(),
    },
    { new: true }
  );

  if (!user) {
    return notFound(res, 'User not found');
  }

  return success(res, null, 'User deleted successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
