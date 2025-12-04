/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const { authenticate, authorize, validate } = require('../../../../shared/middleware');
const { productSchemas } = require('../../../../shared/schemas');
const upload = require('../middleware/upload');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

// Get all products with filtering, sorting, pagination
router.get('/', productController.getProducts);

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
  validate(productSchemas.create),
  productController.createProduct
);

// Update product
router.patch(
  '/:productId',
  authenticate,
  authorize('admin'),
  validate(productSchemas.update),
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

module.exports = router;
