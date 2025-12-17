import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye, Check, Plus, Minus } from 'lucide-react';
// import { Heart } from 'lucide-react'; // TODO: Uncomment when wishlist feature is implemented
import { useAppDispatch, useAppSelector } from '@/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { Button, Badge } from '@/components/common';
import { formatCurrency, truncateText } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  showQuickView?: boolean;
  onQuickView?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showQuickView = true,
  onQuickView,
}) => {
  const dispatch = useAppDispatch();
  const { isSyncing, cart } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [quantity, setQuantity] = useState(1);

  // Check if product is already in cart
  const isInCart = cart?.items?.some(item => item.productId === product._id) ?? false;

  // Handle both stock and inventory.quantity
  const productStock = product.stock ?? product.inventory?.quantity ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated && !isInCart && productStock > 0) {
      dispatch(addToCart({ productId: product._id, quantity }));
      setQuantity(1); // Reset quantity after adding
    }
  };

  const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= productStock) {
      setQuantity(newQuantity);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const discountPercentage = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Handle both string and object image formats
  const firstImage = product.images?.[0];
  const mainImage = typeof firstImage === 'string'
    ? firstImage
    : (firstImage?.url || product.primaryImage || '/placeholder-product.png');

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image Container */}
      <Link to={`${ROUTES.PRODUCTS}/${product.slug}`} className="block relative">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {productStock === 0 && (
            <Badge variant="error">Out of Stock</Badge>
          )}
          {discountPercentage > 0 && (
            <Badge variant="success">-{discountPercentage}%</Badge>
          )}
          {product.isFeatured && (
            <Badge variant="primary">Featured</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* TODO: Uncomment when wishlist feature is implemented
          <button
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            title="Add to Wishlist"
          >
            <Heart className="h-5 w-5 text-gray-600" />
          </button>
          */}
          {showQuickView && (
            <button
              onClick={handleQuickView}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              title="Quick View"
            >
              <Eye className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Category */}
        {product.category && typeof product.category !== 'string' && (
          <Link
            to={`${ROUTES.PRODUCTS}?category=${product.category._id}`}
            className="text-xs text-primary-600 hover:text-primary-700 uppercase tracking-wide"
          >
            {product.category.name}
          </Link>
        )}

        {/* Name */}
        <Link to={`${ROUTES.PRODUCTS}/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mt-1 hover:text-primary-600 transition-colors line-clamp-2">
            {truncateText(product.name, 50)}
          </h3>
        </Link>

        {/* Rating */}
        {product.ratings && product.ratings.average > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(product.ratings.average)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.ratings.count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {productStock > 0 && productStock <= 5 && (
          <p className="text-sm text-orange-600 mt-2">
            Only {productStock} left in stock
          </p>
        )}

        {/* Spacer to push add to cart to bottom */}
        <div className="flex-grow min-h-2" />

        {/* Quantity Selector & Add to Cart */}
        {isAuthenticated && productStock > 0 && (
          <div className="mt-4 space-y-2">
            {!isInCart && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => handleQuantityChange(-1, e)}
                  disabled={quantity <= 1}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                <button
                  onClick={(e) => handleQuantityChange(1, e)}
                  disabled={quantity >= productStock}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
            <Button
              variant={isInCart ? "secondary" : "primary"}
              fullWidth
              size="sm"
              onClick={handleAddToCart}
              disabled={isSyncing || isInCart}
            >
              {isInCart ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        )}

        {/* Out of stock message */}
        {productStock === 0 && (
          <div className="mt-4">
            <Button variant="outline" fullWidth size="sm" disabled>
              Out of Stock
            </Button>
          </div>
        )}

        {/* Login to add to cart */}
        {!isAuthenticated && productStock > 0 && (
          <div className="mt-4">
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" fullWidth size="sm">
                Login to Add to Cart
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
