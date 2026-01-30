'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input, Button, Alert, EmailVerificationBanner, Section, Modal } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { profileService, UpdateProfileData, ChangePasswordData } from '@/services/profile'
import { addressService, Address } from '@/services/address'

interface RestaurantImage {
  id: string
  url: string | null
}

// Icons
const WarningIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const TrashIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const LocationIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function MyProfilePage() {
  const { user, isLoading, updateUser, logout } = useAuth()

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    notes: '',
  })
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState('')

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  })
  const [profileInitialized, setProfileInitialized] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Restaurant images (placeholder)
  const [restaurantImages, setRestaurantImages] = useState<RestaurantImage[]>([
    { id: '1', url: null },
    { id: '2', url: null },
    { id: '3', url: null },
    { id: '4', url: null },
  ])

  // Initialize profile form when user loads
  useEffect(() => {
    if (user && !profileInitialized) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        email: user.email,
      })
      setProfileInitialized(true)
    }
  }, [user, profileInitialized])

  // Load addresses
  useEffect(() => {
    if (user) {
      loadAddresses()
    }
  }, [user])

  const loadAddresses = async () => {
    try {
      setAddressesLoading(true)
      const { addresses } = await addressService.getAddresses()
      setAddresses(addresses)
    } catch {
      // Ignore errors loading addresses
    } finally {
      setAddressesLoading(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAddressForm((prev) => ({ ...prev, [name]: value }))
  }

  const openAddAddressModal = () => {
    setEditingAddress(null)
    setAddressForm({
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      notes: '',
    })
    setAddressError('')
    setShowAddressModal(true)
  }

  const openEditAddressModal = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      address: address.address,
      city: address.city,
      state: address.state || '',
      country: address.country,
      postalCode: address.postalCode || '',
      notes: address.notes || '',
    })
    setAddressError('')
    setShowAddressModal(true)
  }

  const closeAddressModal = () => {
    setShowAddressModal(false)
    setEditingAddress(null)
    setAddressError('')
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressLoading(true)
    setAddressError('')

    if (!addressForm.address || !addressForm.city || !addressForm.country) {
      setAddressError('Address, city, and country are required')
      setAddressLoading(false)
      return
    }

    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, addressForm)
      } else {
        await addressService.addAddress(addressForm)
      }
      await loadAddresses()
      closeAddressModal()
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setAddressLoading(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressService.deleteAddress(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // Ignore errors
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id)
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      )
    } catch {
      // Ignore errors
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const data: UpdateProfileData = {}
      if (profileForm.firstName !== user?.firstName) {
        data.firstName = profileForm.firstName
      }
      if (profileForm.lastName !== user?.lastName) {
        data.lastName = profileForm.lastName
      }
      if (profileForm.phone !== (user?.phone || '')) {
        data.phone = profileForm.phone || undefined
      }
      if (profileForm.email !== user?.email) {
        data.email = profileForm.email
      }

      if (Object.keys(data).length === 0) {
        setProfileError('No changes to save')
        return
      }

      const response = await profileService.updateProfile(data)
      updateUser(response.user)

      if (response.emailChanged) {
        setProfileSuccess('Profile updated. Please check your new email for a verification link.')
      } else {
        setProfileSuccess('Profile updated successfully')
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      setPasswordLoading(false)
      return
    }

    try {
      const data: ChangePasswordData = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }

      await profileService.changePassword(data)
      setPasswordSuccess('Password changed successfully')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAddRestaurantImage = () => {
    const newId = `${Date.now()}`
    setRestaurantImages((prev) => [...prev, { id: newId, url: null }])
  }

  const handleRemoveRestaurantImage = (id: string) => {
    setRestaurantImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError('')

    try {
      await profileService.deleteAccount()
      // Logout will redirect to login page
      await logout()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  const openDeleteModal = () => {
    setShowDeleteModal(true)
    setDeleteStep(1)
    setDeleteError('')
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeleteStep(1)
    setDeleteError('')
  }

  const isRestaurantOwner = user?.role === 'RESTAURANT_OWNER'
  const isGoogleUser = !user?.phone && user?.avatarUrl?.includes('google')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmailVerificationBanner />
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {user.role.replace('_', ' ')}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Picture Section */}
        <Section title="Profile Picture">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.firstName}'s avatar`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-100">
                  <span className="text-3xl font-bold text-gray-400">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                Upload a new profile picture. Recommended size: 200x200px.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="!py-2 !px-4 text-sm"
                  disabled
                >
                  Upload Photo
                </Button>
                {user.avatarUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-2 !px-4 text-sm text-red-600 hover:text-red-700"
                    disabled
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Photo upload coming soon
              </p>
            </div>
          </div>
        </Section>

        {/* Basic Info Section */}
        <Section title="Basic Information">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileSuccess && <Alert type="success">{profileSuccess}</Alert>}
            {profileError && <Alert type="error">{profileError}</Alert>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                id="firstName"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                placeholder="Your first name"
              />
              <Input
                label="Last Name"
                type="text"
                id="lastName"
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                placeholder="Your last name"
              />
            </div>

            <Input
              label="Email"
              type="email"
              id="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              placeholder="you@example.com"
            />

            <Input
              label="Phone Number"
              type="tel"
              id="phone"
              name="phone"
              value={profileForm.phone}
              onChange={handleProfileChange}
              placeholder="+1 234 567 8900"
              hint="(optional)"
            />

            <div className="flex items-center gap-4 pt-2">
              <Button type="submit" isLoading={profileLoading} className="!w-auto !px-6">
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <div className="flex items-center gap-2 text-sm">
                {user.emailVerified ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Email verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Email not verified
                  </span>
                )}
              </div>
            </div>
          </form>
        </Section>

        {/* Addresses Section */}
        <Section
          title="My Addresses"
          description="Manage your delivery addresses"
          headerAction={
            <Button
              type="button"
              variant="secondary"
              className="!w-auto !py-2 !px-4 text-sm"
              onClick={openAddAddressModal}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Address
              </span>
            </Button>
          }
        >
          {addressesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">No addresses yet</p>
              <Button
                type="button"
                variant="secondary"
                className="!w-auto !py-2 !px-4"
                onClick={openAddAddressModal}
              >
                Add your first address
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`relative p-4 rounded-xl border-2 transition-colors ${
                    address.isDefault
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {address.isDefault && (
                    <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{address.address}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {address.city}, {address.country}
                      </p>
                      {address.notes && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{address.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => openEditAddressModal(address)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Edit
                    </button>
                    {!address.isDefault && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(address.id)}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Set as default
                        </button>
                      </>
                    )}
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Change Password Section - Hidden for Google-only users */}
        {!isGoogleUser && (
          <Section title="Change Password">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordSuccess && <Alert type="success">{passwordSuccess}</Alert>}
              {passwordError && <Alert type="error">{passwordError}</Alert>}

              <Input
                label="Current Password"
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                showPasswordToggle
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  showPasswordToggle
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  showPasswordToggle
                />
              </div>

              <p className="text-xs text-gray-500">
                Password must be at least 8 characters long.
              </p>

              <Button type="submit" isLoading={passwordLoading} className="!w-auto !px-6">
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </Section>
        )}

        {/* Restaurant Images Section - Only for Restaurant Owners */}
        {isRestaurantOwner && (
          <Section
            title="Restaurant Photos"
            description="Showcase your restaurant with appealing photos"
            headerAction={
              <Button
                type="button"
                variant="secondary"
                className="!w-auto !py-2 !px-4 text-sm"
                onClick={handleAddRestaurantImage}
                disabled
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Photo
                </span>
              </Button>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {restaurantImages.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-100 group"
                >
                  {image.url ? (
                    <img
                      src={image.url}
                      alt="Restaurant"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Upload image"
                      disabled
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove image"
                      onClick={() => handleRemoveRestaurantImage(image.id)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Photo upload functionality coming soon. Photos will be stored on cloud storage.
            </p>
          </Section>
        )}

        {/* Account Info Section */}
        <Section title="Account Information">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Role</span>
              <span className="text-gray-900">{user.role.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email Status</span>
              <span className={user.emailVerified ? 'text-green-600' : 'text-yellow-600'}>
                {user.emailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Phone Status</span>
              <span className={user.phoneVerified ? 'text-green-600' : 'text-gray-400'}>
                {user.phoneVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone" variant="danger">
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="!w-auto !px-6 !border-red-300 !text-red-600 hover:!bg-red-50"
            onClick={openDeleteModal}
          >
            Delete Account
          </Button>
        </Section>
      </main>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title={deleteStep === 1 ? 'Delete Account?' : 'Final Confirmation'}
        icon={deleteStep === 1 ? WarningIcon : TrashIcon}
        iconColor="red"
        actions={
          deleteStep === 1
            ? [
                { label: 'Cancel', onClick: closeDeleteModal, variant: 'secondary' },
                { label: 'Yes, delete my account', onClick: () => setDeleteStep(2), variant: 'secondary' },
              ]
            : [
                { label: 'Cancel', onClick: closeDeleteModal, variant: 'secondary', disabled: deleteLoading },
                { label: deleteLoading ? 'Deleting...' : 'I understand, delete my account', onClick: handleDeleteAccount, variant: 'danger', loading: deleteLoading },
              ]
        }
      >
        {deleteStep === 1 ? (
          <p className="text-sm text-gray-600">
            Are you sure you want to delete your account? This action cannot be undone. All your data, including orders, reviews, and profile information will be permanently removed.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              This is your last chance to change your mind.
            </p>
            <p className="text-sm font-medium text-red-600 mb-2">
              Click the button below to permanently delete your account.
            </p>
            {deleteError && (
              <div className="mt-4">
                <Alert type="error">{deleteError}</Alert>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={closeAddressModal}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
        icon={LocationIcon}
        iconColor="primary"
        size="lg"
      >
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          {addressError && (
            <Alert type="error">{addressError}</Alert>
          )}

          <Input
            label="Street Address"
            id="address"
            name="address"
            value={addressForm.address}
            onChange={handleAddressChange}
            placeholder="123 Main Street, Apt 4"
            autoComplete="street-address"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              id="city"
              name="city"
              value={addressForm.city}
              onChange={handleAddressChange}
              placeholder="New York"
              autoComplete="address-level2"
            />
            <Input
              label="State/Province"
              id="state"
              name="state"
              value={addressForm.state}
              onChange={handleAddressChange}
              placeholder="NY"
              hint="(optional)"
              autoComplete="address-level1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              id="country"
              name="country"
              value={addressForm.country}
              onChange={handleAddressChange}
              placeholder="USA"
              autoComplete="country-name"
            />
            <Input
              label="Postal Code"
              id="postalCode"
              name="postalCode"
              value={addressForm.postalCode}
              onChange={handleAddressChange}
              placeholder="10001"
              hint="(optional)"
              autoComplete="postal-code"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={addressForm.notes}
              onChange={handleAddressChange}
              placeholder="e.g., Ring doorbell, leave at door..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeAddressModal}
              disabled={addressLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={addressLoading}
            >
              {addressLoading ? 'Saving...' : editingAddress ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
