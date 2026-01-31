'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input, Button, Alert, EmailVerificationBanner, Section, Modal } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { profileService, UpdateProfileData, ChangePasswordData, MyRestaurant, MyMenuItem, Category } from '@/services/profile'
import { addressService, Address } from '@/services/address'

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

  // Restaurant state
  const [restaurants, setRestaurants] = useState<MyRestaurant[]>([])
  const [restaurantsLoading, setRestaurantsLoading] = useState(true)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<MyRestaurant | null>(null)
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    minOrderAmount: '',
    deliveryFee: '',
    images: [] as string[],
  })
  const [restaurantLoading, setRestaurantLoading] = useState(false)
  const [restaurantError, setRestaurantError] = useState('')

  // Restaurant view modal state
  const [viewingRestaurant, setViewingRestaurant] = useState<MyRestaurant | null>(null)
  const [showViewRestaurantModal, setShowViewRestaurantModal] = useState(false)

  // Menu items state
  const [menuItems, setMenuItems] = useState<MyMenuItem[]>([])
  const [menuItemsLoading, setMenuItemsLoading] = useState(false)
  const [showMenuItemsModal, setShowMenuItemsModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [editingMenuItem, setEditingMenuItem] = useState<MyMenuItem | null>(null)
  const [showMenuItemFormModal, setShowMenuItemFormModal] = useState(false)
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    isAvailable: true,
    preparationTime: '',
  })
  const [menuItemLoading, setMenuItemLoading] = useState(false)
  const [menuItemError, setMenuItemError] = useState('')

  // Delete menu item confirmation state
  const [showDeleteMenuItemModal, setShowDeleteMenuItemModal] = useState(false)
  const [deletingMenuItem, setDeletingMenuItem] = useState<MyMenuItem | null>(null)
  const [deleteMenuItemLoading, setDeleteMenuItemLoading] = useState(false)

  // Delete restaurant confirmation state
  const [showDeleteRestaurantModal, setShowDeleteRestaurantModal] = useState(false)
  const [deletingRestaurant, setDeletingRestaurant] = useState<MyRestaurant | null>(null)
  const [deleteRestaurantLoading, setDeleteRestaurantLoading] = useState(false)

  // Menu items pagination and search state
  const [menuItemsPage, setMenuItemsPage] = useState(1)
  const [menuItemsPerPage, setMenuItemsPerPage] = useState(5)
  const [menuItemsSearch, setMenuItemsSearch] = useState('')

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

  // Load restaurants for owners
  useEffect(() => {
    if (user?.role === 'RESTAURANT_OWNER') {
      loadRestaurants()
    }
  }, [user])

  const loadRestaurants = async () => {
    try {
      setRestaurantsLoading(true)
      const { restaurants: data } = await profileService.getMyRestaurants()
      setRestaurants(data)
    } catch {
      // Ignore errors loading restaurants
    } finally {
      setRestaurantsLoading(false)
    }
  }

  const handleRestaurantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setRestaurantForm((prev) => ({ ...prev, [name]: value }))
  }

  const openAddRestaurantModal = () => {
    setEditingRestaurant(null)
    setRestaurantForm({
      name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      minOrderAmount: '',
      deliveryFee: '',
      images: [],
    })
    setRestaurantError('')
    setShowRestaurantModal(true)
  }

  const openEditRestaurantModal = (restaurant: MyRestaurant) => {
    setEditingRestaurant(restaurant)
    // Build images array from logo and cover if they exist
    const images: string[] = []
    if (restaurant.logoUrl) images.push(restaurant.logoUrl)
    if (restaurant.coverUrl) images.push(restaurant.coverUrl)

    setRestaurantForm({
      name: restaurant.name,
      description: restaurant.description || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      address: restaurant.place.address,
      city: restaurant.place.city,
      country: restaurant.place.country,
      postalCode: '',
      minOrderAmount: restaurant.minOrderAmount || '',
      deliveryFee: restaurant.deliveryFee || '',
      images,
    })
    setRestaurantError('')
    setShowRestaurantModal(true)
  }

  const closeRestaurantModal = () => {
    setShowRestaurantModal(false)
    setEditingRestaurant(null)
    setRestaurantError('')
  }

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRestaurantLoading(true)
    setRestaurantError('')

    try {
      if (editingRestaurant) {
        // Update existing restaurant
        // Use first image as logo, second as cover (for backward compatibility)
        const { restaurant } = await profileService.updateMyRestaurant(editingRestaurant.id, {
          name: restaurantForm.name,
          description: restaurantForm.description || null,
          phone: restaurantForm.phone || null,
          email: restaurantForm.email || null,
          minOrderAmount: restaurantForm.minOrderAmount ? parseFloat(restaurantForm.minOrderAmount) : null,
          deliveryFee: restaurantForm.deliveryFee ? parseFloat(restaurantForm.deliveryFee) : null,
          logoUrl: restaurantForm.images[0] || null,
          coverUrl: restaurantForm.images[1] || null,
        })
        // Update local state with response data
        setRestaurants((prev) => prev.map((r) => (r.id === restaurant.id ? restaurant : r)))
      } else {
        // Create new restaurant
        if (!restaurantForm.name || !restaurantForm.address || !restaurantForm.city || !restaurantForm.country) {
          setRestaurantError('Name, address, city, and country are required')
          setRestaurantLoading(false)
          return
        }
        const { restaurant } = await profileService.createMyRestaurant({
          name: restaurantForm.name,
          description: restaurantForm.description || null,
          phone: restaurantForm.phone || null,
          email: restaurantForm.email || null,
          address: restaurantForm.address,
          city: restaurantForm.city,
          country: restaurantForm.country,
          postalCode: restaurantForm.postalCode || null,
          minOrderAmount: restaurantForm.minOrderAmount ? parseFloat(restaurantForm.minOrderAmount) : null,
          deliveryFee: restaurantForm.deliveryFee ? parseFloat(restaurantForm.deliveryFee) : null,
        })
        // Add new restaurant to local state
        setRestaurants((prev) => [...prev, restaurant])
      }
      closeRestaurantModal()
    } catch (err) {
      setRestaurantError(err instanceof Error ? err.message : 'Failed to save restaurant')
    } finally {
      setRestaurantLoading(false)
    }
  }

  const openDeleteRestaurantModal = (restaurant: MyRestaurant) => {
    setDeletingRestaurant(restaurant)
    setShowDeleteRestaurantModal(true)
  }

  const closeDeleteRestaurantModal = () => {
    setShowDeleteRestaurantModal(false)
    setDeletingRestaurant(null)
  }

  const handleDeleteRestaurant = async () => {
    if (!deletingRestaurant) return
    setDeleteRestaurantLoading(true)
    try {
      await profileService.deleteMyRestaurant(deletingRestaurant.id)
      setRestaurants((prev) => prev.filter((r) => r.id !== deletingRestaurant.id))
      closeDeleteRestaurantModal()
    } catch {
      // Ignore errors
    } finally {
      setDeleteRestaurantLoading(false)
    }
  }

  // Restaurant view modal functions
  const openViewRestaurantModal = (restaurant: MyRestaurant) => {
    setViewingRestaurant(restaurant)
    setShowViewRestaurantModal(true)
  }

  const closeViewRestaurantModal = () => {
    setShowViewRestaurantModal(false)
    setViewingRestaurant(null)
  }

  // Menu items functions
  const loadMenuItems = async (restaurantId: string) => {
    try {
      setMenuItemsLoading(true)
      const [{ items }, { categories: cats }] = await Promise.all([
        profileService.getMyMenuItems(restaurantId),
        profileService.getCategories(),
      ])
      setMenuItems(items)
      setCategories(cats)
    } catch {
      // Ignore errors
    } finally {
      setMenuItemsLoading(false)
    }
  }

  const openMenuItemsModal = async () => {
    if (!viewingRestaurant) return
    setShowMenuItemsModal(true)
    setMenuItemsPage(1)
    setMenuItemsSearch('')
    await loadMenuItems(viewingRestaurant.id)
  }

  const closeMenuItemsModal = () => {
    setShowMenuItemsModal(false)
    setMenuItems([])
    setMenuItemsPage(1)
    setMenuItemsSearch('')
  }

  const openAddMenuItemModal = () => {
    setEditingMenuItem(null)
    setMenuItemForm({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      categoryId: '',
      isAvailable: true,
      preparationTime: '',
    })
    setMenuItemError('')
    setShowMenuItemFormModal(true)
  }

  const openEditMenuItemModal = (item: MyMenuItem) => {
    setEditingMenuItem(item)
    setMenuItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      categoryId: item.category?.id || '',
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime?.toString() || '',
    })
    setMenuItemError('')
    setShowMenuItemFormModal(true)
  }

  const closeMenuItemFormModal = () => {
    setShowMenuItemFormModal(false)
    setEditingMenuItem(null)
    setMenuItemError('')
  }

  const handleMenuItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setMenuItemForm((prev) => ({ ...prev, [name]: checked }))
    } else {
      setMenuItemForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleMenuItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viewingRestaurant) return

    setMenuItemLoading(true)
    setMenuItemError('')

    try {
      if (editingMenuItem) {
        const { item } = await profileService.updateMyMenuItem(viewingRestaurant.id, editingMenuItem.id, {
          name: menuItemForm.name,
          description: menuItemForm.description || null,
          price: parseFloat(menuItemForm.price),
          imageUrl: menuItemForm.imageUrl || null,
          categoryId: menuItemForm.categoryId || null,
          isAvailable: menuItemForm.isAvailable,
          preparationTime: menuItemForm.preparationTime ? parseInt(menuItemForm.preparationTime, 10) : null,
        })
        // Update local state with response data
        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
      } else {
        if (!menuItemForm.name || !menuItemForm.price) {
          setMenuItemError('Name and price are required')
          setMenuItemLoading(false)
          return
        }
        const { item } = await profileService.createMyMenuItem(viewingRestaurant.id, {
          name: menuItemForm.name,
          description: menuItemForm.description || null,
          price: parseFloat(menuItemForm.price),
          imageUrl: menuItemForm.imageUrl || null,
          categoryId: menuItemForm.categoryId || null,
          isAvailable: menuItemForm.isAvailable,
          preparationTime: menuItemForm.preparationTime ? parseInt(menuItemForm.preparationTime, 10) : null,
        })
        // Add new item to local state
        setMenuItems((prev) => [...prev, item])
      }
      closeMenuItemFormModal()
    } catch (err) {
      setMenuItemError(err instanceof Error ? err.message : 'Failed to save menu item')
    } finally {
      setMenuItemLoading(false)
    }
  }

  const openDeleteMenuItemModal = (item: MyMenuItem) => {
    setDeletingMenuItem(item)
    setShowDeleteMenuItemModal(true)
  }

  const closeDeleteMenuItemModal = () => {
    setShowDeleteMenuItemModal(false)
    setDeletingMenuItem(null)
  }

  const handleDeleteMenuItem = async () => {
    if (!viewingRestaurant || !deletingMenuItem) return
    setDeleteMenuItemLoading(true)
    try {
      await profileService.deleteMyMenuItem(viewingRestaurant.id, deletingMenuItem.id)
      const newItems = menuItems.filter((item) => item.id !== deletingMenuItem.id)
      setMenuItems(newItems)
      // Adjust page if current page becomes empty (considering search filter)
      const filteredNewItems = newItems.filter(item =>
        item.name.toLowerCase().includes(menuItemsSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(menuItemsSearch.toLowerCase())
      )
      const newTotalPages = Math.ceil(filteredNewItems.length / menuItemsPerPage)
      if (menuItemsPage > newTotalPages && newTotalPages > 0) {
        setMenuItemsPage(newTotalPages)
      }
      closeDeleteMenuItemModal()
    } catch {
      // Ignore errors
    } finally {
      setDeleteMenuItemLoading(false)
    }
  }

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
        const { address } = await addressService.updateAddress(editingAddress.id, addressForm)
        // Update local state with response data
        setAddresses((prev) => prev.map((a) => (a.id === address.id ? address : a)))
      } else {
        const { address } = await addressService.addAddress(addressForm)
        // Add new address to local state
        setAddresses((prev) => [...prev, address])
      }
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
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

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

        {/* My Restaurants Section - Only for Restaurant Owners */}
        {isRestaurantOwner && (
          <Section
            title="My Restaurants"
            description="Manage your restaurants"
            headerAction={
              <Button
                type="button"
                variant="secondary"
                className="!w-auto !py-2 !px-4 text-sm"
                onClick={openAddRestaurantModal}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Restaurant
                </span>
              </Button>
            }
          >
            {restaurantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">No restaurants yet</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="!w-auto !py-2 !px-4"
                  onClick={openAddRestaurantModal}
                >
                  Add your first restaurant
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="relative p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => openViewRestaurantModal(restaurant)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {restaurant.logoUrl ? (
                          <img
                            src={restaurant.logoUrl}
                            alt={restaurant.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{restaurant.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {restaurant.place.city}, {restaurant.place.country}
                        </p>
                        {restaurant.rating && (
                          <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {restaurant.rating}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openViewRestaurantModal(restaurant)
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        View
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditRestaurantModal(restaurant)
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteRestaurantModal(restaurant)
                        }}
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

        {/* Administration Section - Only for Admins */}
        {isAdmin && (
          <Section title="Administration">
            <p className="text-sm text-gray-600 mb-4">
              Access the admin panel to manage users, restaurants, orders, and more.
            </p>
            <Link href="/panel">
              <Button type="button" className="!w-auto !px-6">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Go to Admin Panel
                </span>
              </Button>
            </Link>
          </Section>
        )}

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

      {/* Restaurant Modal */}
      <Modal
        isOpen={showRestaurantModal}
        onClose={closeRestaurantModal}
        title={editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        iconColor="primary"
        size="lg"
      >
        <form onSubmit={handleRestaurantSubmit} className="space-y-4">
          {restaurantError && (
            <Alert type="error">{restaurantError}</Alert>
          )}

          <Input
            label="Restaurant Name"
            type="text"
            id="restaurantName"
            name="name"
            value={restaurantForm.name}
            onChange={handleRestaurantChange}
            placeholder="Your restaurant name"
          />

          <div>
            <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="restaurantDescription"
              name="description"
              value={restaurantForm.description}
              onChange={handleRestaurantChange}
              placeholder="Describe your restaurant..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              id="restaurantPhone"
              name="phone"
              value={restaurantForm.phone}
              onChange={handleRestaurantChange}
              placeholder="+1 234 567 8900"
              hint="(optional)"
            />
            <Input
              label="Email"
              type="email"
              id="restaurantEmail"
              name="email"
              value={restaurantForm.email}
              onChange={handleRestaurantChange}
              placeholder="contact@restaurant.com"
              hint="(optional)"
            />
          </div>

          {/* Gallery Section - Series of Images */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Gallery (Interior, Exterior, etc.)</p>
            <div className="grid grid-cols-3 gap-3">
              {restaurantForm.images.map((imgUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imgUrl}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setRestaurantForm((prev) => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {/* Add new image button */}
              {restaurantForm.images.length < 6 && (
                <button
                  type="button"
                  className="group flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => {
                    // For now visual only - will implement file upload later
                  }}
                >
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 group-hover:text-primary-600 mt-1">{restaurantForm.images.length} / 6</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click to add images (up to 6)</p>
          </div>

          {!editingRestaurant && (
            <>
              <p className="text-sm text-gray-600 font-medium mt-4 mb-2">Location</p>
              <Input
                label="Street Address"
                type="text"
                id="restaurantAddress"
                name="address"
                value={restaurantForm.address}
                onChange={handleRestaurantChange}
                placeholder="123 Main Street"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  type="text"
                  id="restaurantCity"
                  name="city"
                  value={restaurantForm.city}
                  onChange={handleRestaurantChange}
                  placeholder="New York"
                />
                <Input
                  label="Country"
                  type="text"
                  id="restaurantCountry"
                  name="country"
                  value={restaurantForm.country}
                  onChange={handleRestaurantChange}
                  placeholder="USA"
                />
              </div>

              <Input
                label="Postal Code"
                type="text"
                id="restaurantPostalCode"
                name="postalCode"
                value={restaurantForm.postalCode}
                onChange={handleRestaurantChange}
                placeholder="10001"
                hint="(optional)"
              />
            </>
          )}

          <p className="text-sm text-gray-600 font-medium mt-4 mb-2">Delivery Settings</p>

          <div className="grid grid-cols-2 gap-4 items-start">
            <Input
              label="Min. Order"
              type="number"
              step="0.01"
              min="0"
              id="minOrderAmount"
              name="minOrderAmount"
              value={restaurantForm.minOrderAmount}
              onChange={handleRestaurantChange}
              placeholder="0.00"
              prefix="$"
              hint="(optional)"
            />
            <Input
              label="Delivery Fee"
              type="number"
              step="0.01"
              min="0"
              id="deliveryFee"
              name="deliveryFee"
              value={restaurantForm.deliveryFee}
              onChange={handleRestaurantChange}
              placeholder="0.00"
              prefix="$"
              hint="(optional)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeRestaurantModal}
              disabled={restaurantLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={restaurantLoading}
            >
              {restaurantLoading ? 'Saving...' : editingRestaurant ? 'Save Changes' : 'Add Restaurant'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Restaurant View Modal */}
      <Modal
        isOpen={showViewRestaurantModal}
        onClose={closeViewRestaurantModal}
        title={viewingRestaurant?.name || 'Restaurant'}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        iconColor="primary"
        size="lg"
      >
        {viewingRestaurant && (
          <div className="space-y-6">
            {/* Cover Image */}
            {viewingRestaurant.coverUrl && (
              <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={viewingRestaurant.coverUrl}
                  alt={`${viewingRestaurant.name} cover`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Logo and Basic Info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {viewingRestaurant.logoUrl ? (
                  <img
                    src={viewingRestaurant.logoUrl}
                    alt={viewingRestaurant.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900">{viewingRestaurant.name}</h3>
                {viewingRestaurant.description && (
                  <p className="text-sm text-gray-600 mt-1">{viewingRestaurant.description}</p>
                )}
                {viewingRestaurant.rating && parseFloat(viewingRestaurant.rating) > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-yellow-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium">{viewingRestaurant.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="text-gray-900">
                    {viewingRestaurant.place.address}, {viewingRestaurant.place.city}, {viewingRestaurant.place.country}
                  </p>
                </div>
                {viewingRestaurant.phone && (
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-900">{viewingRestaurant.phone}</p>
                  </div>
                )}
                {viewingRestaurant.email && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-gray-900">{viewingRestaurant.email}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {viewingRestaurant.minOrderAmount && (
                  <div>
                    <p className="text-gray-500">Min Order Amount</p>
                    <p className="text-gray-900">${viewingRestaurant.minOrderAmount}</p>
                  </div>
                )}
                {viewingRestaurant.deliveryFee && (
                  <div>
                    <p className="text-gray-500">Delivery Fee</p>
                    <p className="text-gray-900">${viewingRestaurant.deliveryFee}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                className="flex-1"
                onClick={openMenuItemsModal}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Edit Menu Items
                </span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  closeViewRestaurantModal()
                  openEditRestaurantModal(viewingRestaurant)
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Restaurant
                </span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Menu Items Modal */}
      <Modal
        isOpen={showMenuItemsModal}
        onClose={closeMenuItemsModal}
        title={`Menu Items - ${viewingRestaurant?.name || ''}`}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
        iconColor="primary"
        size="lg"
      >
        <div className="space-y-4">
          {/* Back button */}
          <button
            type="button"
            onClick={closeMenuItemsModal}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to restaurant
          </button>

          {/* Search and Add */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search menu items..."
                value={menuItemsSearch}
                onChange={(e) => {
                  setMenuItemsSearch(e.target.value)
                  setMenuItemsPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="!w-auto !py-2 !px-4 text-sm"
              onClick={openAddMenuItemModal}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </span>
            </Button>
          </div>

          <p className="text-sm text-gray-600">
            {menuItems.length} item{menuItems.length !== 1 ? 's' : ''} in menu
            {menuItemsSearch && ` (${menuItems.filter(item => item.name.toLowerCase().includes(menuItemsSearch.toLowerCase()) || item.description?.toLowerCase().includes(menuItemsSearch.toLowerCase())).length} matching)`}
          </p>

          {menuItemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">No menu items yet</p>
              <Button
                type="button"
                variant="secondary"
                className="!w-auto !py-2 !px-4"
                onClick={openAddMenuItemModal}
              >
                Add your first item
              </Button>
            </div>
          ) : (
            (() => {
              const filteredItems = menuItems.filter(item =>
                item.name.toLowerCase().includes(menuItemsSearch.toLowerCase()) ||
                item.description?.toLowerCase().includes(menuItemsSearch.toLowerCase())
              )
              const totalPages = Math.ceil(filteredItems.length / menuItemsPerPage)
              const paginatedItems = filteredItems.slice((menuItemsPage - 1) * menuItemsPerPage, menuItemsPage * menuItemsPerPage)

              return (
                <>
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No items match your search</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-sm font-semibold text-primary-600">${item.price}</span>
                                  {item.category && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                      {item.category.name}
                                    </span>
                                  )}
                                  {!item.isAvailable && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                      Unavailable
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditMenuItemModal(item)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteMenuItemModal(item)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Pagination */}
                  {filteredItems.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-500">
                          {(menuItemsPage - 1) * menuItemsPerPage + 1} - {Math.min(menuItemsPage * menuItemsPerPage, filteredItems.length)} of {filteredItems.length}
                        </p>
                        <select
                          value={menuItemsPerPage}
                          onChange={(e) => {
                            setMenuItemsPerPage(Number(e.target.value))
                            setMenuItemsPage(1)
                          }}
                          className="text-sm border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value={5}>5 / page</option>
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={50}>50 / page</option>
                        </select>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMenuItemsPage((p) => Math.max(1, p - 1))}
                            disabled={menuItemsPage === 1}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-sm text-gray-700 px-2">
                            {menuItemsPage} / {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMenuItemsPage((p) => Math.min(totalPages, p + 1))}
                            disabled={menuItemsPage >= totalPages}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()
          )}
        </div>
      </Modal>

      {/* Menu Item Form Modal */}
      <Modal
        isOpen={showMenuItemFormModal}
        onClose={closeMenuItemFormModal}
        title={editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
        iconColor="primary"
        size="lg"
      >
        <form onSubmit={handleMenuItemSubmit} className="space-y-4">
          {menuItemError && (
            <Alert type="error">{menuItemError}</Alert>
          )}

          <Input
            label="Item Name"
            type="text"
            id="menuItemName"
            name="name"
            value={menuItemForm.name}
            onChange={handleMenuItemChange}
            placeholder="e.g., Margherita Pizza"
          />

          <div>
            <label htmlFor="menuItemDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="menuItemDescription"
              name="description"
              value={menuItemForm.description}
              onChange={handleMenuItemChange}
              placeholder="Describe the item..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              min="0"
              id="menuItemPrice"
              name="price"
              value={menuItemForm.price}
              onChange={handleMenuItemChange}
              placeholder="0.00"
              prefix="$"
            />
            <Input
              label="Preparation Time (min)"
              type="number"
              min="0"
              id="menuItemPreparationTime"
              name="preparationTime"
              value={menuItemForm.preparationTime}
              onChange={handleMenuItemChange}
              placeholder="15"
              hint="(optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="menuItemCategory" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                id="menuItemCategory"
                name="categoryId"
                value={menuItemForm.categoryId}
                onChange={handleMenuItemChange}
                className="input-field"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={menuItemForm.isAvailable}
                  onChange={handleMenuItemChange}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Available</span>
              </label>
            </div>
          </div>

          <Input
            label="Image URL"
            type="url"
            id="menuItemImageUrl"
            name="imageUrl"
            value={menuItemForm.imageUrl}
            onChange={handleMenuItemChange}
            placeholder="https://example.com/image.jpg"
            hint="(optional)"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeMenuItemFormModal}
              disabled={menuItemLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={menuItemLoading}
            >
              {menuItemLoading ? 'Saving...' : editingMenuItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Menu Item Confirmation Modal */}
      <Modal
        isOpen={showDeleteMenuItemModal}
        onClose={closeDeleteMenuItemModal}
        title="Delete Menu Item?"
        icon={TrashIcon}
        iconColor="red"
        actions={[
          { label: 'Cancel', onClick: closeDeleteMenuItemModal, variant: 'secondary', disabled: deleteMenuItemLoading },
          { label: deleteMenuItemLoading ? 'Deleting...' : 'Delete', onClick: handleDeleteMenuItem, variant: 'danger', loading: deleteMenuItemLoading },
        ]}
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium text-gray-900">{deletingMenuItem?.name}</span>? This action cannot be undone.
        </p>
      </Modal>

      {/* Delete Restaurant Confirmation Modal */}
      <Modal
        isOpen={showDeleteRestaurantModal}
        onClose={closeDeleteRestaurantModal}
        title="Delete Restaurant?"
        icon={TrashIcon}
        iconColor="red"
        actions={[
          { label: 'Cancel', onClick: closeDeleteRestaurantModal, variant: 'secondary', disabled: deleteRestaurantLoading },
          { label: deleteRestaurantLoading ? 'Deleting...' : 'Delete', onClick: handleDeleteRestaurant, variant: 'danger', loading: deleteRestaurantLoading },
        ]}
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium text-gray-900">{deletingRestaurant?.name}</span>? This will also delete all menu items associated with this restaurant. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
