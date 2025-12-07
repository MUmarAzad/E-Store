import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, MapPin, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchProfile } from '@/store/slices/authSlice';
import {
  Card,
  Button,
  Input,
  Avatar,
  Badge,
  Modal,
  Alert,
  Loading,
} from '@/components/common';
import { AddressForm } from '@/components/checkout';
import authService from '@/services/auth.service';
import { formatDate } from '@/utils/helpers';
import type { Address } from '@/types';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses'>(
    'profile'
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      await authService.updateProfile(data);
      dispatch(fetchProfile());
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      passwordForm.reset();
      setSuccess('Password changed successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressSubmit = async (address: Address) => {
    setIsSaving(true);
    setError(null);
    try {
      if (editingAddress?._id) {
        await authService.updateAddress(editingAddress._id, address);
        setSuccess('Address updated successfully');
      } else {
        await authService.addAddress(address);
        setSuccess('Address added successfully');
      }
      setShowAddressModal(false);
      setEditingAddress(null);
      await dispatch(fetchProfile()).unwrap();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await authService.deleteAddress(addressId);
      await dispatch(fetchProfile()).unwrap();
      setSuccess('Address deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await authService.setDefaultAddress(addressId);
      await dispatch(fetchProfile()).unwrap();
      setSuccess('Default address updated');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set default address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResendingVerification(true);
    setError(null);
    try {
      await authService.resendVerification(user.email);
      setSuccess('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResendingVerification(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Verification Warning */}
      {!user.isVerified && (
        <Alert
          type="warning"
          title="Email Not Verified"
          message={
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm">
                Please verify your email address to access all features.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                isLoading={isResendingVerification}
                className="flex-shrink-0"
              >
                Resend Verification Email
              </Button>
            </div>
          }
        />
      )}

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            src={user.avatar}
            size="lg"
          />
          <div>
            <h2 className="text-xl font-semibold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">{user.role}</Badge>
              {user.isVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="h-4 w-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock className="h-4 w-4 inline mr-2" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'addresses'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="h-4 w-4 inline mr-2" />
          Addresses
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <form
            onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                leftIcon={<User className="h-5 w-5 text-gray-400" />}
                error={profileForm.formState.errors.firstName?.message}
                {...profileForm.register('firstName')}
              />
              <Input
                label="Last Name"
                error={profileForm.formState.errors.lastName?.message}
                {...profileForm.register('lastName')}
              />
            </div>
            <Input
              label="Email"
              type="email"
              leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
              error={profileForm.formState.errors.email?.message}
              {...profileForm.register('email')}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+92 (555) 000-0000"
              error={profileForm.formState.errors.phone?.message}
              {...profileForm.register('phone')}
            />
            <div className="pt-4">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            className="space-y-4 max-w-md"
          >
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <div className="pt-4">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Change Password
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-2">Account Info</h3>
            <p className="text-sm text-gray-500">
              Account created: {formatDate(user.createdAt)}
            </p>
          </div>
        </Card>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                setEditingAddress(null);
                setShowAddressModal(true);
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Address
            </Button>
          </div>

          {user.addresses && user.addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.addresses.map((address, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      {address.isDefault && (
                        <Badge variant="primary" className="mb-2">
                          Default
                        </Badge>
                      )}
                      <p className="text-gray-900">{address.street}</p>
                      <p className="text-gray-600">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-gray-600">{address.country}</p>
                    </div>
                    <div className="flex gap-2">
                      {!address.isDefault && address._id && (
                        <button
                          onClick={() => handleSetDefaultAddress(address._id!)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingAddress(address);
                          setShowAddressModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <User className="h-4 w-4" />
                      </button>
                      {address._id && (
                        <button
                          onClick={() => handleDeleteAddress(address._id!)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No addresses saved yet</p>
            </Card>
          )}
        </div>
      )}

      {/* Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        title={editingAddress ? 'Edit Address' : 'Add Address'}
      >
        <AddressForm
          defaultValues={editingAddress || undefined}
          onSubmit={handleAddressSubmit}
          onCancel={() => {
            setShowAddressModal(false);
            setEditingAddress(null);
          }}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
};

export default ProfilePage;
