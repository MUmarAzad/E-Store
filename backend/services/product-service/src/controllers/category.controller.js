/**
 * Category Controller
 * Handles category CRUD operations
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler } = require('../../../../shared/utils');
const {
  success,
  created,
  notFound,
  badRequest,
  conflict,
} = require('../../../../shared/utils/apiResponse');
const { slugify } = require('../../../../shared/utils/helpers');

// =============================================================================
// PUBLIC CONTROLLERS
// =============================================================================

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  // Only root categories if specified
  if (req.query.root === 'true') {
    filter.parent = null;
  }

  const categories = await Category.find(filter)
    .populate('parent', 'name slug')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return success(res, { categories });
});

/**
 * @desc    Get category tree (hierarchical structure)
 * @route   GET /api/categories/tree
 * @access  Public
 */
const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Build tree structure
  const buildTree = (categories, parentId = null) => {
    return categories
      .filter((cat) => {
        const catParentId = cat.parent ? cat.parent.toString() : null;
        return catParentId === parentId;
      })
      .map((cat) => ({
        ...cat,
        children: buildTree(categories, cat._id.toString()),
      }));
  };

  const tree = buildTree(categories);

  return success(res, { categories: tree });
});

/**
 * @desc    Get category by slug
 * @route   GET /api/categories/slug/:slug
 * @access  Public
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate('parent', 'name slug');

  if (!category) {
    return notFound(res, 'Category not found');
  }

  // Get product count
  const productCount = await Product.countDocuments({
    category: category._id,
    isActive: true,
    isPublished: true,
  });

  return success(res, {
    category: { ...category.toJSON(), productCount },
  });
});

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:categoryId
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId)
    .populate('parent', 'name slug');

  if (!category) {
    return notFound(res, 'Category not found');
  }

  // Get product count
  const productCount = await Product.countDocuments({
    category: category._id,
    isActive: true,
    isPublished: true,
  });

  return success(res, {
    category: { ...category.toJSON(), productCount },
  });
});

/**
 * @desc    Get subcategories
 * @route   GET /api/categories/:categoryId/subcategories
 * @access  Public
 */
const getSubcategories = asyncHandler(async (req, res) => {
  const parentCategory = await Category.findById(req.params.categoryId);

  if (!parentCategory) {
    return notFound(res, 'Parent category not found');
  }

  const subcategories = await Category.find({
    parent: req.params.categoryId,
    isActive: true,
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Get product counts for each subcategory
  const subcategoriesWithCount = await Promise.all(
    subcategories.map(async (cat) => {
      const productCount = await Product.countDocuments({
        category: cat._id,
        isActive: true,
        isPublished: true,
      });
      return { ...cat, productCount };
    })
  );

  return success(res, { subcategories: subcategoriesWithCount });
});

// =============================================================================
// ADMIN CONTROLLERS
// =============================================================================

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const categoryData = { ...req.body };

  // Generate slug if not provided
  if (!categoryData.slug) {
    categoryData.slug = slugify(categoryData.name);
  }

  // Check if slug already exists
  const existingCategory = await Category.findOne({ slug: categoryData.slug });
  if (existingCategory) {
    return conflict(res, 'A category with this slug already exists');
  }

  // Build path if has parent
  if (categoryData.parent) {
    const parentCategory = await Category.findById(categoryData.parent);
    if (!parentCategory) {
      return badRequest(res, 'Parent category not found');
    }
    categoryData.path = `${parentCategory.path}/${categoryData.slug}`;
    categoryData.level = parentCategory.level + 1;
  } else {
    categoryData.path = categoryData.slug;
    categoryData.level = 0;
  }

  const category = await Category.create(categoryData);

  return created(res, { category }, 'Category created successfully');
});

/**
 * @desc    Update category
 * @route   PATCH /api/categories/:categoryId
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Check if changing slug and if it already exists
  if (updates.slug) {
    const existingCategory = await Category.findOne({
      slug: updates.slug,
      _id: { $ne: req.params.categoryId },
    });
    if (existingCategory) {
      return conflict(res, 'A category with this slug already exists');
    }
  }

  // Update path if changing parent or slug
  if (updates.parent !== undefined || updates.slug) {
    const currentCategory = await Category.findById(req.params.categoryId);
    if (!currentCategory) {
      return notFound(res, 'Category not found');
    }

    const newSlug = updates.slug || currentCategory.slug;

    if (updates.parent && updates.parent !== null) {
      const parentCategory = await Category.findById(updates.parent);
      if (!parentCategory) {
        return badRequest(res, 'Parent category not found');
      }
      updates.path = `${parentCategory.path}/${newSlug}`;
      updates.level = parentCategory.level + 1;
    } else if (updates.parent === null) {
      updates.path = newSlug;
      updates.level = 0;
    } else if (updates.slug && currentCategory.path) {
      // Just updating slug, recalculate path
      const pathParts = currentCategory.path.split('/');
      pathParts[pathParts.length - 1] = newSlug;
      updates.path = pathParts.join('/');
    } else if (updates.slug && !currentCategory.path) {
      // Root category being given a new slug
      updates.path = newSlug;
    }
  }

  const category = await Category.findByIdAndUpdate(
    req.params.categoryId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('parent', 'name slug');

  if (!category) {
    return notFound(res, 'Category not found');
  }

  return success(res, { category }, 'Category updated successfully');
});

/**
 * @desc    Delete category (soft delete)
 * @route   DELETE /api/categories/:categoryId
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);

  if (!category) {
    return notFound(res, 'Category not found');
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return badRequest(res, `Cannot delete category with ${productCount} products. Move or delete products first.`);
  }

  // Check if category has subcategories
  const subcategoryCount = await Category.countDocuments({ parent: category._id });
  if (subcategoryCount > 0) {
    return badRequest(res, `Cannot delete category with ${subcategoryCount} subcategories. Delete subcategories first.`);
  }

  // Soft delete
  category.isActive = false;
  category.deletedAt = new Date();
  await category.save();

  return success(res, null, 'Category deleted successfully');
});

/**
 * @desc    Reorder categories
 * @route   PATCH /api/categories/reorder
 * @access  Private/Admin
 */
const reorderCategories = asyncHandler(async (req, res) => {
  const { categoryOrders } = req.body;

  if (!categoryOrders || !Array.isArray(categoryOrders)) {
    return badRequest(res, 'Category orders array is required');
  }

  // Update sort orders
  const updatePromises = categoryOrders.map(({ id, sortOrder }) =>
    Category.findByIdAndUpdate(id, { sortOrder })
  );

  await Promise.all(updatePromises);

  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return success(res, { categories }, 'Categories reordered successfully');
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  getCategoryById,
  getSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
};
