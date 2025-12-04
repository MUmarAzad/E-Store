/**
 * Cloudinary Configuration
 * Image upload and management service
 */

const cloudinary = require('cloudinary').v2;
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} fileBuffer - Base64 encoded file or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (fileBuffer, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'e-store/products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    };

    const uploadOptions = { ...defaultOptions, ...options };

    // Upload from base64 or URL
    const result = await cloudinary.uploader.upload(fileBuffer, uploadOptions);

    logger.info('Image uploaded', { publicId: result.public_id });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    logger.error('Failed to upload image', error);
    throw error;
  }
};

/**
 * Upload multiple images
 * @param {Array<string>} files - Array of base64 encoded files
 * @param {Object} options - Upload options
 * @returns {Promise<Array<Object>>} Upload results
 */
const uploadMultipleImages = async (files, options = {}) => {
  const uploadPromises = files.map((file) => uploadImage(file, options));
  return Promise.all(uploadPromises);
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('Image deleted', { publicId, result: result.result });
    return result;
  } catch (error) {
    logger.error('Failed to delete image', error);
    throw error;
  }
};

/**
 * Delete multiple images
 * @param {Array<string>} publicIds - Array of public IDs
 * @returns {Promise<Object>} Deletion results
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    logger.info('Multiple images deleted', { count: publicIds.length });
    return result;
  } catch (error) {
    logger.error('Failed to delete multiple images', error);
    throw error;
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} Transformed image URL
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    fetch_format: 'auto',
    quality: 'auto',
  };

  return cloudinary.url(publicId, {
    ...defaultTransformations,
    ...transformations,
  });
};

/**
 * Generate thumbnail URL
 * @param {string} publicId - Cloudinary public ID
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} Thumbnail URL
 */
const getThumbnailUrl = (publicId, width = 200, height = 200) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    fetch_format: 'auto',
    quality: 'auto',
  });
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Extract public ID from URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getOptimizedUrl,
  getThumbnailUrl,
  getPublicIdFromUrl,
};
