/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const { authenticate, authorize, validate } = require('../../../../shared/middleware');
const { productSchemas } = require('../../../../shared/schemas');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

// Get all categories
router.get('/', categoryController.getCategories);

// Get category tree (hierarchical)
router.get('/tree', categoryController.getCategoryTree);

// Get category by slug
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Get category by ID
router.get('/:categoryId', categoryController.getCategoryById);

// Get subcategories
router.get('/:categoryId/subcategories', categoryController.getSubcategories);

// =============================================================================
// PROTECTED ROUTES (Admin Only)
// =============================================================================

// Create category
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(productSchemas.createCategory),
  categoryController.createCategory
);

// Update category
router.patch(
  '/:categoryId',
  authenticate,
  authorize('admin'),
  validate(productSchemas.updateCategory),
  categoryController.updateCategory
);

// Delete category
router.delete(
  '/:categoryId',
  authenticate,
  authorize('admin'),
  categoryController.deleteCategory
);

// Reorder categories
router.patch(
  '/reorder',
  authenticate,
  authorize('admin'),
  categoryController.reorderCategories
);

module.exports = router;
