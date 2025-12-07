// ===================================
// Product Types
// ===================================

export interface ProductImage {
  _id?: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductRating {
  average: number;
  count: number;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category: Category | string;
  subcategory?: string;
  images: ProductImage[];
  inventory: ProductInventory;
  stock: number;
  attributes: ProductAttribute[];
  tags: string[];
  status: ProductStatus;
  isFeatured?: boolean;
  ratings: ProductRating;
  averageRating?: number;
  numReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product filtering
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: ProductStatus;
  inStock?: boolean;
  rating?: number;
}

export interface ProductSort {
  field: 'price' | 'createdAt' | 'name' | 'ratings.average';
  order: 'asc' | 'desc';
}

export interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  categories: Category[];
  filters: ProductFilters;
  sort: ProductSort;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Product form data
export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  subcategory?: string;
  inventory: ProductInventory;
  attributes: ProductAttribute[];
  tags: string[];
  status: ProductStatus;
}
