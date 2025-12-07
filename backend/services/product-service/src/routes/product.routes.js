/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const { authenticate, authorize, validateBody, optionalAuth } = require('../../../../shared/middleware');
const { productSchemas } = require('../../../../shared/schemas');
const upload = require('../middleware/upload');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

// Get all products with filtering, sorting, pagination
// Uses optionalAuth to identify admin users without requiring authentication
router.get('/', optionalAuth, productController.getProducts);

// Search products
router.get('/search', productController.searchProducts);

// Get featured products
router.get('/featured', productController.getFeaturedProducts);

// Get product by slug
router.get('/slug/:slug', productController.getProductBySlug);

// Get product by ID
router.get('/:productId', productController.getProductById);

// Get products by category
router.get('/category/:categoryId', productController.getProductsByCategory);

// =============================================================================
// PROTECTED ROUTES (Admin Only)
// =============================================================================

// Create product
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateBody(productSchemas.create),
  productController.createProduct
);

// Update product
router.patch(
  '/:productId',
  authenticate,
  authorize('admin'),
  validateBody(productSchemas.update),
  productController.updateProduct
);

// Delete product
router.delete(
  '/:productId',
  authenticate,
  authorize('admin'),
  productController.deleteProduct
);

// Upload product images
router.post(
  '/:productId/images',
  authenticate,
  authorize('admin'),
  upload.array('images', 10),
  productController.uploadImages
);

// Delete product image
router.delete(
  '/:productId/images/:imageId',
  authenticate,
  authorize('admin'),
  productController.deleteImage
);

// Update inventory
router.patch(
  '/:productId/inventory',
  authenticate,
  authorize('admin'),
  productController.updateInventory
);

// Bulk update products
router.patch(
  '/bulk/update',
  authenticate,
  authorize('admin'),
  productController.bulkUpdateProducts
);

// Bulk update inventory
router.patch(
  '/bulk/inventory',
  authenticate,
  authorize('admin'),
  productController.bulkUpdateInventory
);

// Get low stock products (public for internal service calls)
router.get(
  '/low-stock',
  productController.getLowStockProducts
);

module.exports = router;
