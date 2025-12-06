import React, { useState, useEffect } from 'react';
import { Search, Eye, UserCheck, UserX } from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Select,
  Pagination,
  Loading,
  EmptyState,
  Card,
  Avatar,
  Modal,
} from '@/components/common';
import { formatDate } from '@/utils/helpers';
import { userService } from '@/services/user.service';
import type { User } from '@/types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers({
        page: currentPage,
        limit: 10,
        role: roleFilter || undefined,
      });
      setUsers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleToggleActive = async (user: User) => {
    try {
      await userService.toggleUserStatus(user._id);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'primary' | 'success' | 'default'> = {
      admin: 'primary',
      seller: 'success',
      customer: 'default',
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'seller', label: 'Seller' },
    { value: 'customer', label: 'Customer' },
  ];

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage user accounts</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Users will appear here when they register."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
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
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={user.firstName}
                          lastName={user.lastName}
                          src={user.avatar}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.isActive ? 'success' : 'error'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-2 rounded-lg ${
                            user.isActive
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      )}

      {/* User Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                firstName={selectedUser.firstName}
                lastName={selectedUser.lastName}
                src={selectedUser.avatar}
                size="lg"
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Verified</p>
                <p className="font-medium">
                  {selectedUser.isVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {selectedUser.addresses && selectedUser.addresses.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Addresses</p>
                <div className="space-y-2">
                  {selectedUser.addresses.map((address, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-3 rounded-lg text-sm"
                    >
                      {address.street}, {address.city}, {address.state}{' '}
                      {address.zipCode}, {address.country}
                      {address.isDefault && (
                        <Badge variant="primary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
