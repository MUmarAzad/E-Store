import React, { useState, useEffect } from 'react';
import { Lock, MapPin, Save, Trash2 } from 'lucide-react';
import {
    Button,
    Input,
    Card,
    Loading,
    Avatar,
    Badge
} from '@/components/common';
import { authService } from '@/services';
import type { User as UserType } from '@/types';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile Form State
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const userData = await authService.getProfile();
            setUser(userData);
            setProfileData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Failed to load profile settings');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const updatedUser = await authService.updateProfile({
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                // Email updates might require verification in some systems, passing it for now
                email: profileData.email
            });
            setUser(updatedUser);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            setSaving(true);
            await authService.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );
            toast.success('Password changed successfully');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Failed to change password:', error);
            // Error message usually comes from backend
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || 'Failed to change password';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAddress = async (addressId: string | undefined) => {
        if (!addressId) return;
        if (!confirm('Are you sure you want to delete this address?')) return;
        try {
            const updatedUser = await authService.deleteAddress(addressId);
            setUser(updatedUser);
            toast.success('Address deleted successfully');
        } catch (error) {
            console.error('Failed to delete address:', error);
            toast.error('Failed to delete address');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loading size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
            </div>

            {/* Profile Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                        {user && (
                            <Avatar
                                firstName={user.firstName}
                                lastName={user.lastName}
                                src={user.avatar}
                                size="lg"
                            />
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                        <p className="text-sm text-gray-500">Update your account's profile information and email address.</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            required
                        />
                        <Input
                            label="Last Name"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            required
                        />
                    </div>
                    <Input
                        label="Email Address"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                    />

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={saving} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Security Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Lock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Security</h2>
                        <p className="text-sm text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="New Password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" variant="outline" isLoading={saving}>
                            Update Password
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Addresses */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">My Addresses</h2>
                        <p className="text-sm text-gray-500">Manage the shipping addresses associated with your account.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {user?.addresses && user.addresses.length > 0 ? (
                        user.addresses.map((address) => (
                            <div key={address._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">
                                            {address.street}
                                        </p>
                                        {address.isDefault && (
                                            <Badge variant="primary" size="sm">Default</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {address.city}, {address.state} {address.zipCode}, {address.country}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteAddress(address._id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Address"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No addresses found. Add one during checkout.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Settings;
