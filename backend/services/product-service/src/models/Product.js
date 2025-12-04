const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Image URL is required']
  },
  alt: {
    type: String,
    default: ''
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

const attributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Attribute name is required'],
    trim: true
  },
  value: {
    type: String,
    required: [true, 'Attribute value is required'],
    trim: true
  }
});

const inventorySchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  trackInventory: {
    type: Boolean,
    default: true
  },
  allowBackorder: {
    type: Boolean,
    default: false
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  }
}, { _id: false });

const ratingsSchema = new mongoose.Schema({
  average: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  count: {
    type: Number,
    default: 0
  }
}, { _id: false });

const seoSchema = new mongoose.Schema({
  metaTitle: {
    type: String,
    maxlength: 70
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  keywords: [{
    type: String
  }]
}, { _id: false });

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },

  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },

  // Categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },

  // Media
  images: [imageSchema],

  // Inventory
  inventory: {
    type: inventorySchema,
    default: () => ({})
  },

  // Attributes
  attributes: [attributeSchema],

  // Tags
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Status
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'archived'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft',
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Ratings
  ratings: {
    type: ratingsSchema,
    default: () => ({})
  },

  // SEO
  seo: {
    type: seoSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
productSchema.virtual('isOnSale').get(function() {
  return this.compareAtPrice && this.compareAtPrice > this.price;
});

productSchema.virtual('discountPercentage').get(function() {
  if (!this.isOnSale) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

productSchema.virtual('inStock').get(function() {
  if (!this.inventory.trackInventory) return true;
  return this.inventory.quantity > 0 || this.inventory.allowBackorder;
});

productSchema.virtual('isLowStock').get(function() {
  if (!this.inventory.trackInventory) return false;
  return this.inventory.quantity <= this.inventory.lowStockThreshold && this.inventory.quantity > 0;
});

productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0]?.url || null);
});

// Indexes
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'inventory.sku': 1 }, { unique: true, sparse: true });
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ createdAt: -1 });

// Text index for search
productSchema.index(
  { name: 'text', description: 'text', tags: 'text', brand: 'text' },
  { 
    weights: { 
      name: 10, 
      brand: 5,
      tags: 3, 
      description: 1 
    },
    name: 'ProductTextIndex'
  }
);

// Pre-save: Generate slug from name if not provided
productSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Ensure at least one primary image
  if (this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }
  
  next();
});

// Static method to search products
productSchema.statics.search = async function(query, options = {}) {
  const {
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    status = 'active',
    sort = '-createdAt',
    inStock
  } = options;

  const filter = { status };

  // Text search
  if (query) {
    filter.$text = { $search: query };
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  // Stock filter
  if (inStock === true) {
    filter.$or = [
      { 'inventory.trackInventory': false },
      { 'inventory.quantity': { $gt: 0 } },
      { 'inventory.allowBackorder': true }
    ];
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    this.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(filter)
  ]);

  return {
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to update inventory
productSchema.statics.updateInventory = async function(productId, quantityChange, session = null) {
  const options = session ? { session } : {};
  
  const product = await this.findById(productId, null, options);
  if (!product) {
    throw new Error('Product not found');
  }

  if (!product.inventory.trackInventory) {
    return product;
  }

  const newQuantity = product.inventory.quantity + quantityChange;
  
  if (newQuantity < 0 && !product.inventory.allowBackorder) {
    throw new Error(`Insufficient stock for ${product.name}`);
  }

  product.inventory.quantity = Math.max(0, newQuantity);
  return product.save(options);
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
