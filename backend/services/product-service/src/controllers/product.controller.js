/**
 * Product Controller
 * Handles product CRUD operations and image management
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinaryService = require('../config/cloudinary');
const { asyncHandler } = require('../../../../shared/utils');
const {
  success,
  created,
  notFound,
  badRequest,
  paginated,
} = require('../../../../shared/utils/apiResponse');
const {
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
} = require('../../../../shared/utils/pagination');
const { slugify } = require('../../../../shared/utils/helpers');

// =============================================================================
// PUBLIC CONTROLLERS
// =============================================================================

/**
 * @desc    Get all products with filtering and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const sort = parseSortParams(req.query.sort, [
    'createdAt', 'name', 'pricing.price', 'ratings.average', 'inventory.quantity'
  ]);

  // Build filter - for admin, show all products; for public, filter active only
  const filter = {};
  
  // Only filter by status if not an admin request
  // Admin requests will have the auth middleware and user role
  const isAdmin = req.user?.role === 'admin';
  
  if (!isAdmin) {
    filter.status = 'active';
  }

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) {
      filter.price.$gte = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filter.price.$lte = parseFloat(req.query.maxPrice);
    }
  }

  // In stock filter
  if (req.query.inStock === 'true') {
    filter.$or = [
      { 'inventory.trackInventory': false },
      { 'inventory.quantity': { $gt: 0 } },
      { 'inventory.allowBackorder': true }
    ];
  }

  // Featured filter
  if (req.query.featured === 'true') {
    filter.isFeatured = true;
  }

  // Brand filter
  if (req.query.brand) {
    filter.brand = req.query.brand;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return paginated(res, { data: products, page, limit, total });
});

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return badRequest(res, 'Search query must be at least 2 characters');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {
    status: 'active',
    $text: { $search: q },
  };

  const [products, total] = await Promise.all([
    Product.find(filter, { score: { $meta: 'textScore' } })
      .populate('category', 'name slug')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  return paginated(res, { data: products, page: parseInt(page), limit: parseInt(limit), total });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await Product.find({
    status: 'active',
    isFeatured: true,
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return success(res, { products });
});

/**
 * @desc    Get product by slug
 * @route   GET /api/products/slug/:slug
 * @access  Public
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    status: 'active',
  }).populate('category', 'name slug');

  if (!product) {
    return notFound(res, 'Product not found');
  }

  return success(res, { product });
});

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:productId
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId)
    .populate('category', 'name slug');

  if (!product) {
    return notFound(res, 'Product not found');
  }

  return success(res, { product });
});

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:categoryId
 * @access  Public
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query);

  // Get category and its subcategories
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    return notFound(res, 'Category not found');
  }

  // Get all subcategory IDs
  const subcategories = await Category.find({
    path: { $regex: new RegExp(`^${category.path}`) },
  }).select('_id');

  const categoryIds = [category._id, ...subcategories.map((c) => c._id)];

  const filter = {
    category: { $in: categoryIds },
    status: 'active',
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return paginated(res, { data: products, page, limit, total });
});

// =============================================================================
// ADMIN CONTROLLERS
// =============================================================================

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body };

  // Generate slug if not provided
  if (!productData.slug) {
    productData.slug = slugify(productData.name);
  }

  // Handle top-level SKU by moving to inventory.sku
  if (productData.sku && productData.inventory) {
    productData.inventory.sku = productData.sku;
  } else if (productData.sku && !productData.inventory) {
    productData.inventory = { sku: productData.sku };
  }
  delete productData.sku; // Remove top-level sku as it's a virtual

  // Check if slug already exists
  const existingProduct = await Product.findOne({ slug: productData.slug });
  if (existingProduct) {
    return conflict(res, `A product with the slug "${productData.slug}" already exists. Please use a different product name.`);
  }

  // Verify category exists
  if (productData.category) {
    const category = await Category.findById(productData.category);
    if (!category) {
      return badRequest(res, 'Invalid category');
    }
  }

  const product = await Product.create(productData);

  return created(res, { product }, 'Product created successfully');
});

/**
 * @desc    Update product
 * @route   PATCH /api/products/:productId
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Generate new slug if name changed
  if (updates.name && !updates.slug) {
    updates.slug = slugify(updates.name);
  }

  // Handle top-level SKU by moving to inventory.sku
  if (updates.sku && updates.inventory) {
    updates.inventory.sku = updates.sku;
  } else if (updates.sku && !updates.inventory) {
    updates.inventory = { sku: updates.sku };
  }
  delete updates.sku; // Remove top-level sku as it's a virtual

  // Verify category exists if updating
  if (updates.category) {
    const category = await Category.findById(updates.category);
    if (!category) {
      return badRequest(res, 'Invalid category');
    }
  }

  const product = await Product.findByIdAndUpdate(
    req.params.productId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  if (!product) {
    return notFound(res, 'Product not found');
  }

  return success(res, { product }, 'Product updated successfully');
});

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/products/:productId
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.productId,
    { status: 'archived', deletedAt: new Date() },
    { new: true }
  );

  if (!product) {
    return notFound(res, 'Product not found');
  }

  return success(res, null, 'Product deleted successfully');
});

/**
 * @desc    Upload product images
 * @route   POST /api/products/:productId/images
 * @access  Private/Admin
 */
const uploadImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return notFound(res, 'Product not found');
  }

  if (!req.files || req.files.length === 0) {
    return badRequest(res, 'No images provided');
  }

  // Upload images to Cloudinary
  const uploadPromises = req.files.map((file, index) => {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return cloudinaryService.uploadImage(base64, {
      folder: `e-store/products/${product._id}`,
      public_id: `${product.sku}_${Date.now()}_${index}`,
    });
  });

  const uploadedImages = await Promise.all(uploadPromises);

  // Add images to product
  const newImages = uploadedImages.map((img, index) => ({
    url: img.url,
    publicId: img.publicId,
    alt: `${product.name} - Image ${product.images.length + index + 1}`,
    isPrimary: product.images.length === 0 && index === 0,
  }));

  product.images.push(...newImages);
  await product.save();

  return success(res, { images: product.images }, 'Images uploaded successfully');
});

/**
 * @desc    Delete product image
 * @route   DELETE /api/products/:productId/images/:imageId
 * @access  Private/Admin
 */
const deleteImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return notFound(res, 'Product not found');
  }

  const image = product.images.id(req.params.imageId);
  if (!image) {
    return notFound(res, 'Image not found');
  }

  // Delete from Cloudinary
  if (image.publicId) {
    await cloudinaryService.deleteImage(image.publicId);
  }

  // Remove from product
  const wasPrimary = image.isPrimary;
  product.images.pull(req.params.imageId);

  // If deleted image was primary, set first remaining as primary
  if (wasPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  return success(res, { images: product.images }, 'Image deleted successfully');
});

/**
 * @desc    Update inventory
 * @route   PATCH /api/products/:productId/inventory
 * @access  Private/Admin
 */
const updateInventory = asyncHandler(async (req, res) => {
  const { quantity, lowStockThreshold, trackInventory } = req.body;

  const updates = {};
  if (quantity !== undefined) {
    updates['inventory.quantity'] = quantity;
    updates['inventory.inStock'] = quantity > 0;
  }
  if (lowStockThreshold !== undefined) {
    updates['inventory.lowStockThreshold'] = lowStockThreshold;
  }
  if (trackInventory !== undefined) {
    updates['inventory.trackInventory'] = trackInventory;
  }

  const product = await Product.findByIdAndUpdate(
    req.params.productId,
    { $set: updates },
    { new: true }
  );

  if (!product) {
    return notFound(res, 'Product not found');
  }

  return success(res, { inventory: product.inventory }, 'Inventory updated successfully');
});

/**
 * @desc    Bulk update products
 * @route   PATCH /api/products/bulk/update
 * @access  Private/Admin
 */
const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { productIds, updates } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return badRequest(res, 'Product IDs are required');
  }

  const allowedFields = ['isActive', 'isPublished', 'isFeatured', 'category'];
  const filteredUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: filteredUpdates }
  );

  return success(res, {
    modifiedCount: result.modifiedCount,
  }, `${result.modifiedCount} products updated successfully`);
});

/**
 * @desc    Bulk update inventory
 * @route   PATCH /api/products/bulk/inventory
 * @access  Private/Admin
 */
const bulkUpdateInventory = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return badRequest(res, 'Inventory updates are required');
  }

  const results = {
    success: [],
    failed: []
  };

  for (const update of updates) {
    try {
      const { productId, quantity, lowStockThreshold, trackInventory } = update;
      
      if (!productId) {
        results.failed.push({ productId: 'unknown', error: 'Product ID is required' });
        continue;
      }

      const inventoryUpdates = {};
      if (quantity !== undefined) {
        inventoryUpdates['inventory.quantity'] = quantity;
        inventoryUpdates['inventory.inStock'] = quantity > 0;
      }
      if (lowStockThreshold !== undefined) {
        inventoryUpdates['inventory.lowStockThreshold'] = lowStockThreshold;
      }
      if (trackInventory !== undefined) {
        inventoryUpdates['inventory.trackInventory'] = trackInventory;
      }

      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: inventoryUpdates },
        { new: true }
      );

      if (!product) {
        results.failed.push({ productId, error: 'Product not found' });
      } else {
        results.success.push({ 
          productId, 
          name: product.name,
          inventory: product.inventory 
        });
      }
    } catch (error) {
      results.failed.push({ productId: update.productId, error: error.message });
    }
  }

  return success(res, results, `Bulk inventory update completed: ${results.success.length} successful, ${results.failed.length} failed`);
});

/**
 * @desc    Get low stock products
 * @route   GET /api/products/low-stock
 * @access  Private/Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const lowStockProducts = await Product.find({
    'inventory.trackInventory': true,
    $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] }
  })
  .select('name slug inventory images')
  .sort({ 'inventory.quantity': 1 })
  .limit(parseInt(limit))
  .lean();

  return success(res, { products: lowStockProducts });
});

module.exports = {
  getProducts,
  searchProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  deleteImage,
  updateInventory,
  bulkUpdateProducts,
  bulkUpdateInventory,
  getLowStockProducts,
};
