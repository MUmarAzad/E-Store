/**
 * Upload Routes
 * Standalone image upload functionality
 */

const express = require('express');
const router = express.Router();
const cloudinaryService = require('../config/cloudinary');
const { authenticate, authorize } = require('../../../../shared/middleware');
const upload = require('../middleware/upload');
const { success, badRequest } = require('../../../../shared/utils');

/**
 * @desc    Upload a single image to Cloudinary
 * @route   POST /api/upload/image
 * @access  Private/Admin
 */
router.post(
  '/image',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return badRequest(res, 'No image provided');
      }

      // Convert to base64
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadImage(base64, {
        folder: 'e-store/products',
        public_id: `product_${Date.now()}`,
      });

      return success(res, {
        url: result.url,
        publicId: result.publicId,
      }, 'Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @desc    Upload multiple images to Cloudinary
 * @route   POST /api/upload/images
 * @access  Private/Admin
 */
router.post(
  '/images',
  authenticate,
  authorize('admin'),
  upload.array('images', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return badRequest(res, 'No images provided');
      }

      // Upload all images to Cloudinary
      const uploadPromises = req.files.map((file, index) => {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return cloudinaryService.uploadImage(base64, {
          folder: 'e-store/products',
          public_id: `product_${Date.now()}_${index}`,
        });
      });

      const results = await Promise.all(uploadPromises);

      return success(res, {
        images: results.map(r => ({
          url: r.url,
          publicId: r.publicId,
        })),
      }, 'Images uploaded successfully');
    } catch (error) {
      console.error('Images upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @desc    Delete an image from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private/Admin
 */
router.delete(
  '/:publicId',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const { publicId } = req.params;
      
      await cloudinaryService.deleteImage(publicId);

      return success(res, null, 'Image deleted successfully');
    } catch (error) {
      console.error('Image delete error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
