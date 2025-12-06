import React, { useState } from 'react';
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { Button, Badge, Alert } from '@/components/common';
import { formatCurrency } from '@/utils/helpers';
import type { Product } from '@/types';

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { isSyncing } = useAppSelector((state) => state.cart);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) return;
    
    await dispatch(addToCart({ productId: product._id, quantity }));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const discountPercentage = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const images = product.images?.length
    ? product.images
    : [{ url: '/placeholder-product.png', alt: product.name }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          <img
            src={images[selectedImage]?.url}
            alt={images[selectedImage]?.alt || product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thumbnail Images */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index
                    ? 'border-primary-500'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt || `${product.name} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Category & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {product.category && (
            <span className="text-sm text-primary-600 uppercase tracking-wide">
              {typeof product.category === 'object' ? product.category.name : product.category}
            </span>
          )}
          {product.featured && <Badge variant="primary">Featured</Badge>}
          {discountPercentage > 0 && (
            <Badge variant="success">-{discountPercentage}% OFF</Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
          {product.name}
        </h1>

        {/* Rating */}
        {(product.averageRating ?? 0) > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.averageRating ?? 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              {(product.averageRating ?? 0).toFixed(1)} ({product.numReviews} reviews)
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xl text-gray-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed">{product.description}</p>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {product.stock > 0 ? (
            <>
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-medium">
                In Stock
                {product.stock <= 10 && (
                  <span className="text-orange-600 ml-1">
                    (Only {product.stock} left)
                  </span>
                )}
              </span>
            </>
          ) : (
            <span className="text-red-600 font-medium">Out of Stock</span>
          )}
        </div>

        {/* Quantity & Add to Cart */}
        {product.stock > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {addedToCart && (
              <Alert type="success" message="Product added to cart!" />
            )}

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={!isAuthenticated || isSyncing}
                className="flex-1"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAuthenticated ? 'Add to Cart' : 'Login to Add'}
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Truck className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Free Shipping</p>
              <p className="text-sm text-gray-500">On orders over $50</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Shield className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Secure Payment</p>
              <p className="text-sm text-gray-500">100% protected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <RotateCcw className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Easy Returns</p>
              <p className="text-sm text-gray-500">30 day returns</p>
            </div>
          </div>
        </div>

        {/* SKU & Tags */}
        {(product.sku || (product.tags && product.tags.length > 0)) && (
          <div className="pt-6 border-t space-y-2 text-sm text-gray-500">
            {product.sku && (
              <p>
                <span className="font-medium">SKU:</span> {product.sku}
              </p>
            )}
            {product.tags && product.tags.length > 0 && (
              <p>
                <span className="font-medium">Tags:</span>{' '}
                {product.tags.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
