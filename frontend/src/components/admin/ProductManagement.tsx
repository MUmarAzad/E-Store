import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, CheckSquare, Square } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchProducts, deleteProduct, setPage, setFilters } from '@/store/slices/productsSlice';
import {
  Button,
  Input,
  Badge,
  Modal,
  Pagination,
  Loading,
  EmptyState,
  Card,
} from '@/components/common';
import { formatCurrency, truncateText } from '@/utils/helpers';
import { productService } from '@/services';
import { toast } from 'react-hot-toast';
import ProductForm from './ProductForm';
import type { Product, Category } from '@/types';

const ProductManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: products, isLoading, pagination } = useAppSelector(
    (state) => state.products
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    dispatch(setPage(currentPage));
    dispatch(setFilters({ search: searchQuery }));
    dispatch(fetchProducts());
  }, [dispatch, currentPage, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowFormModal(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedProduct) {
      await dispatch(deleteProduct(selectedProduct._id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
      toast.success('Product deleted successfully');
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setSelectedProduct(null);
    dispatch(fetchProducts());
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p._id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      const deletePromises = Array.from(selectedProducts).map(id =>
        dispatch(deleteProduct(id))
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedProducts.size} product(s) deleted successfully`);
      setSelectedProducts(new Set());
      setShowBulkDeleteModal(false);
      dispatch(fetchProducts());
    } catch (error) {
      toast.error('Failed to delete some products');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'archived') => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      const updatePromises = Array.from(selectedProducts).map(async (id) => {
        return productService.updateProduct(id, {
          status: status
        });
      });

      await Promise.all(updatePromises);
      toast.success(`${selectedProducts.size} product(s) ${status === 'active' ? 'activated' : 'archived'} successfully`);
      setSelectedProducts(new Set());
      dispatch(fetchProducts());
    } catch (error) {
      toast.error('Failed to update some products');
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedProduct(null);
            setShowFormModal(true);
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Bulk Actions */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          {selectedProducts.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedProducts.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('active')}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('archived')}
              >
                Archive
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Products Table */}
      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Get started by creating your first product."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setSelectedProduct(null);
                setShowFormModal(true);
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center text-gray-500 hover:text-gray-700"
                      title={selectedProducts.size === products.length ? 'Deselect All' : 'Select All'}
                    >
                      {selectedProducts.size === products.length ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleProductSelection(product._id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedProducts.has(product._id) ? (
                          <CheckSquare className="h-5 w-5 text-primary-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Eye className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {truncateText(product.name, 30)}
                          </p>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">
                        {typeof product.category === 'string' 
                          ? product.category 
                          : product.category?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(product.price)}
                        </p>
                        {product.compareAtPrice && (
                          <p className="text-sm text-gray-400 line-through">
                            {formatCurrency(product.compareAtPrice)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          product.stock === 0
                            ? 'text-red-600'
                            : product.stock <= 10
                            ? 'text-orange-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={product.status === 'active' ? 'success' : product.status === 'draft' ? 'warning' : 'error'}
                      >
                        {product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : 'Archived'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Product"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-medium">{selectedProduct?.name}</span>? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Product Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={selectedProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowFormModal(false)}
        />
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
        title="Delete Products"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete {selectedProducts.size} product(s)? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteModal(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmBulkDelete}
              isLoading={isBulkDeleting}
            >
              Delete {selectedProducts.size} Product(s)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement;
