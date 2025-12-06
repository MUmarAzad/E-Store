import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { fetchCategories, setFilters, clearFilters } from '@/store/slices/productsSlice';
import { Button, Input } from '@/components/common';
import type { ProductFilters as Filters } from '@/types';

interface ProductFiltersProps {
  onFilterChange?: (filters: Filters) => void;
  showMobile?: boolean;
  onCloseMobile?: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  onFilterChange,
  showMobile = false,
  onCloseMobile,
}) => {
  const dispatch = useAppDispatch();
  const [, setSearchParams] = useSearchParams();
  const { categories, filters } = useAppSelector((state) => state.products);

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    availability: true,
  });

  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || '',
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = { ...filters, category: categoryId, page: 1 };
    dispatch(setFilters(newFilters));
    onFilterChange?.(newFilters);
    updateSearchParams(newFilters);
  };

  const handlePriceChange = () => {
    const newFilters = {
      ...filters,
      minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
      maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
      page: 1,
    };
    dispatch(setFilters(newFilters));
    onFilterChange?.(newFilters);
    updateSearchParams(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    const newFilters = { ...filters, rating, page: 1 };
    dispatch(setFilters(newFilters));
    onFilterChange?.(newFilters);
    updateSearchParams(newFilters);
  };

  const handleInStockChange = (inStock: boolean) => {
    const newFilters = { ...filters, inStock, page: 1 };
    dispatch(setFilters(newFilters));
    onFilterChange?.(newFilters);
    updateSearchParams(newFilters);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setPriceRange({ min: '', max: '' });
    setSearchParams({});
    onFilterChange?.({});
  };

  const updateSearchParams = (newFilters: Filters) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.rating) params.set('rating', newFilters.rating.toString());
    if (newFilters.inStock) params.set('inStock', 'true');
    if (newFilters.search) params.set('search', newFilters.search);
    setSearchParams(params);
  };

  const hasActiveFilters =
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.rating ||
    filters.inStock;

  const filterContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
        >
          Categories
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="space-y-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`block w-full text-left px-2 py-1 rounded transition-colors ${
                !filters.category
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryChange(category._id)}
                className={`block w-full text-left px-2 py-1 rounded transition-colors ${
                  filters.category === category._id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
        >
          Price Range
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                className="w-full"
              />
              <span className="text-gray-400">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={handlePriceChange}
            >
              Apply Price
            </Button>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
        >
          Rating
          {expandedSections.rating ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.rating && (
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingChange(rating)}
                className={`flex items-center gap-2 w-full px-2 py-1 rounded transition-colors ${
                  filters.rating === rating
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-4 w-4 ${
                        i < rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span>& Up</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div>
        <button
          onClick={() => toggleSection('availability')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
        >
          Availability
          {expandedSections.availability ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.availability && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => handleInStockChange(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-gray-600">In Stock Only</span>
          </label>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          fullWidth
          onClick={handleClearFilters}
          className="mt-4"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  // Mobile Filter Sidebar
  if (showMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-50" onClick={onCloseMobile} />
        <div className="fixed left-0 top-0 h-full w-80 max-w-full bg-white shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>
            <button
              onClick={onCloseMobile}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{filterContent}</div>
        </div>
      </>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">{filterContent}</div>
  );
};

export default ProductFilters;
