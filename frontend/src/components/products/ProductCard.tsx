import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Eye, Check } from 'lucide-react';
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

  // Check if product is already in cart
  const isInCart = cart?.items?.some(item => item.productId === product._id) ?? false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated && !isInCart) {
      dispatch(addToCart({ productId: product._id, quantity: 1 }));
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

  const mainImage = product.images?.[0]?.url || '/placeholder-product.png';

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
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
          {product.stock === 0 && (
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
          <button
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            title="Add to Wishlist"
          >
            <Heart className="h-5 w-5 text-gray-600" />
          </button>
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

        {/* Add to Cart Button (on hover) */}
        {product.stock > 0 && isAuthenticated && (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
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
      </Link>

      {/* Product Info */}
      <div className="p-4">
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
          <h3 className="font-semibold text-gray-900 mt-1 hover:text-primary-600 transition-colors">
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
                  className={`h-4 w-4 ${
                    i < Math.floor(product.ratings.average)
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
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-sm text-orange-600 mt-2">
            Only {product.stock} left in stock
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
