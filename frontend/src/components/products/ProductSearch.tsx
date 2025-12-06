import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks';
import { ROUTES } from '@/utils/constants';

interface ProductSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  autoNavigate?: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  placeholder = 'Search products...',
  className = '',
  onSearch,
  autoNavigate = true,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [isFocused, setIsFocused] = useState(false);

  const debouncedSearch = useDebounce((value: string) => {
    if (onSearch) {
      onSearch(value);
    } else if (autoNavigate && value.trim()) {
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(value.trim())}`);
    }
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else if (autoNavigate) {
        navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <div
        className={`flex items-center bg-gray-100 rounded-lg transition-all duration-200 ${
          isFocused ? 'ring-2 ring-primary-500 bg-white' : ''
        }`}
      >
        <div className="pl-4">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductSearch;
