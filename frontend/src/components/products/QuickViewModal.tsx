import React from 'react';
import { ShoppingCart, Star, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { Modal, Button, Badge } from '@/components/common';
import { formatCurrency } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import type { Product } from '@/types';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { isSyncing } = useAppSelector((state) => state.cart);
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  // Handle both stock and inventory.quantity
  const productStock = product.stock ?? product.inventory?.quantity ?? 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) return;
    dispatch(addToCart({ productId: product._id, quantity }));
    onClose();
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= productStock) {
      setQuantity(newQuantity);
    }
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Category & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="text-sm text-primary-600 uppercase tracking-wide">
                {typeof product.category === 'object' ? product.category.name : product.category}
              </span>
            )}
            {discountPercentage > 0 && (
              <Badge variant="success">-{discountPercentage}%</Badge>
            )}
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>

          {/* Rating */}
          {(product.averageRating ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.averageRating ?? 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                ({product.numReviews} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-lg text-gray-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 line-clamp-3">{product.description}</p>

          {/* Stock */}
          <div>
            {productStock > 0 ? (
              <span className="text-green-600 font-medium">
                In Stock ({productStock} available)
              </span>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          {productStock > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Qty:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= productStock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={!isAuthenticated || isSyncing}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}

          {/* View Full Details */}
          <Link
            to={`${ROUTES.PRODUCTS}/${product.slug}`}
            onClick={onClose}
            className="block text-center text-primary-600 hover:text-primary-700 font-medium"
          >
            View Full Details →
          </Link>
        </div>
      </div>
    </Modal>
  );
};

export default QuickViewModal;
