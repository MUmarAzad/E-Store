import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchProducts, setFilters, setPage } from '@/store/slices/productsSlice';
import { Button, Select, Pagination } from '@/components/common';
import {
  ProductGrid,
  ProductFilters,
  ProductSearch,
  QuickViewModal,
} from '@/components/products';
import type { Product } from '@/types';

const sortOptions = [
  { value: '', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Top Rated' },
];

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { items: products, isLoading, filters, pagination } = useAppSelector(
    (state) => state.products
  );

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');

    dispatch(
      setFilters({
        category: category || undefined,
        search: search || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        rating: rating ? parseInt(rating, 10) : undefined,
      })
    );
  }, [dispatch, searchParams]);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch, filters]);

  const handleSortChange = (_value: string) => {
    // Sort is handled via the sort state in productsSlice
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex gap-8">
      {/* Sidebar Filters - Desktop */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <ProductFilters />
        </div>
      </aside>

      {/* Mobile Filters */}
      {showMobileFilters && (
        <ProductFilters
          showMobile
          onCloseMobile={() => setShowMobileFilters(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            {pagination && (
              <p className="text-gray-500 mt-1">
                Showing {products.length} of {pagination.total} products
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
            </Button>

            {/* Sort */}
            <div className="w-44">
              <Select
                options={sortOptions}
                value={''}
                onChange={handleSortChange}
              />
            </div>

            {/* View Mode */}
            <div className="hidden sm:flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <ProductSearch
            placeholder="Search in results..."
            autoNavigate={false}
            onSearch={(query) =>
              dispatch(setFilters({ ...filters, search: query }))
            }
          />
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={products}
          isLoading={isLoading}
          columns={viewMode === 'list' ? 2 : 3}
          onQuickView={setQuickViewProduct}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default ProductsPage;
