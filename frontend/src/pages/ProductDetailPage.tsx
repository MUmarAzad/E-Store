import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchProductBySlug, fetchProducts } from '@/store/slices/productsSlice';
import { Loading, EmptyState } from '@/components/common';
import { ProductDetails, ProductGrid } from '@/components/products';
import { ROUTES } from '@/utils/constants';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { selectedProduct, items: relatedProducts, isLoading, error } = useAppSelector(
    (state) => state.products
  );

  useEffect(() => {
    if (slug) {
      dispatch(fetchProductBySlug(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (selectedProduct) {
      dispatch(fetchProducts());
    }
  }, [dispatch, selectedProduct]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !selectedProduct) {
    return (
      <EmptyState
        title="Product not found"
        description="The product you're looking for doesn't exist or has been removed."
        action={
          <Link to={ROUTES.PRODUCTS}>
            <button className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
              <ArrowLeft className="h-5 w-5" />
              Back to Products
            </button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link to={ROUTES.HOME} className="hover:text-gray-700">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to={ROUTES.PRODUCTS} className="hover:text-gray-700">
          Products
        </Link>
        {selectedProduct.category && typeof selectedProduct.category !== 'string' && (
          <>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link
              to={`${ROUTES.PRODUCTS}?category=${selectedProduct.category._id}`}
              className="hover:text-gray-700"
            >
              {selectedProduct.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">{selectedProduct.name}</span>
      </nav>

      {/* Product Details */}
      <ProductDetails product={selectedProduct} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Related Products
          </h2>
          <ProductGrid products={relatedProducts.slice(0, 4)} columns={4} />
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
