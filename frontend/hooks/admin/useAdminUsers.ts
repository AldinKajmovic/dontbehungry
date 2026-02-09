'use client'

import { useState, useCallback } from 'react'
import { adminService, AdminUser, UserFilters } from '@/services/admin'
import { profileService } from '@/services/profile'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'
import { useAdminList } from './useAdminList'
import { useAdminModals } from './useAdminModals'

interface UserFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: string
  avatarUrl: string
  userAddressId: string
  userAddress: string
  userCity: string
  userCountry: string
  userPostalCode: string
  userLatitude: number | undefined
  userLongitude: number | undefined
  restaurantName: string
  restaurantDescription: string
  restaurantPhone: string
  restaurantEmail: string
  restaurantAddress: string
  restaurantCity: string
  restaurantCountry: string
  restaurantPostalCode: string
  restaurantLatitude: number | undefined
  restaurantLongitude: number | undefined
}

const EMPTY_FORM: UserFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'CUSTOMER',
  avatarUrl: '',
  userAddressId: '',
  userAddress: '',
  userCity: '',
  userCountry: '',
  userPostalCode: '',
  userLatitude: undefined,
  userLongitude: undefined,
  restaurantName: '',
  restaurantDescription: '',
  restaurantPhone: '',
  restaurantEmail: '',
  restaurantAddress: '',
  restaurantCity: '',
  restaurantCountry: '',
  restaurantPostalCode: '',
  restaurantLatitude: undefined,
  restaurantLongitude: undefined,
}

export function useAdminUsers() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const ROLE_OPTIONS = [
    { value: 'CUSTOMER', label: t('admin.roles.CUSTOMER') },
    { value: 'RESTAURANT_OWNER', label: t('admin.roles.RESTAURANT_OWNER') },
    { value: 'DELIVERY_DRIVER', label: t('admin.roles.DELIVERY_DRIVER') },
    { value: 'ADMIN', label: t('admin.roles.ADMIN') },
  ]

  const FILTER_CONFIG = [
    {
      key: 'role',
      label: t('admin.roles.label'),
      options: [
        { value: 'CUSTOMER', label: t('admin.roles.CUSTOMER') },
        { value: 'RESTAURANT_OWNER', label: t('admin.roles.RESTAURANT_OWNER') },
        { value: 'DELIVERY_DRIVER', label: t('admin.roles.DELIVERY_DRIVER') },
        { value: 'ADMIN', label: t('admin.roles.ADMIN') },
      ],
      placeholder: t('admin.roles.allRoles'),
    },
    {
      key: 'emailVerified',
      label: t('admin.status.label'),
      options: [
        { value: 'true', label: t('admin.status.verified') },
        { value: 'false', label: t('admin.status.pending') },
      ],
      placeholder: t('admin.status.allStatuses'),
    },
  ]

  const fetchFn = useCallback(
    (page: number, limit: number, search?: string, filters?: UserFilters, sort?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
      adminService.getUsers(page, limit, search, filters, sort),
    []
  )

  const list = useAdminList<AdminUser, UserFilters>({ fetchFn })
  const modals = useAdminModals()
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Form states
  const [imageUploading, setImageUploading] = useState(false)
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    try {
      const { url } = await profileService.uploadImage(file, 'avatar')
      setFormData(prev => ({ ...prev, avatarUrl: url }))
      toast.success(t('upload.success'))
      return url
    } catch {
      toast.error(t('upload.failed'))
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const handleAvatarRemove = () => {
    if (formData.avatarUrl && formData.avatarUrl.startsWith('https://storage.googleapis.com/')) {
      profileService.deleteImage(formData.avatarUrl).catch(() => {})
    }
    setFormData(prev => ({ ...prev, avatarUrl: '' }))
  }

  const openCreateModal = () => {
    setFormData(EMPTY_FORM)
    setFormError('')
    modals.setShowCreateModal(true)
  }

  const openEditModal = async (user: AdminUser) => {
    setSelectedUser(user)
    setFormError('')

    // Fetch user's addresses
    let defaultAddress: Pick<UserFormData, 'userAddressId' | 'userAddress' | 'userCity' | 'userCountry' | 'userPostalCode' | 'userLatitude' | 'userLongitude'> = {
      userAddressId: '',
      userAddress: '',
      userCity: '',
      userCountry: '',
      userPostalCode: '',
      userLatitude: undefined,
      userLongitude: undefined,
    }

    try {
      const addresses = await adminService.getUserAddresses(user.id)
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
      if (defaultAddr) {
        defaultAddress = {
          userAddressId: defaultAddr.id,
          userAddress: defaultAddr.address,
          userCity: defaultAddr.city,
          userCountry: defaultAddr.country,
          userPostalCode: defaultAddr.postalCode || '',
          userLatitude: defaultAddr.latitude || undefined,
          userLongitude: defaultAddr.longitude || undefined,
        }
      }
    } catch {
      // Ignore errors loading addresses
    }

    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      avatarUrl: user.avatarUrl || '',
      ...defaultAddress,
      restaurantName: '',
      restaurantDescription: '',
      restaurantPhone: '',
      restaurantEmail: '',
      restaurantAddress: '',
      restaurantCity: '',
      restaurantCountry: '',
      restaurantPostalCode: '',
      restaurantLatitude: undefined,
      restaurantLongitude: undefined,
    })
    modals.setShowEditModal(true)
  }

  const openDeleteModal = (user: AdminUser) => {
    setSelectedUser(user)
    modals.setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormLoading(true)
      setFormError('')

      // Validate restaurant fields if role is RESTAURANT_OWNER
      if (formData.role === 'RESTAURANT_OWNER') {
        if (!formData.restaurantName || !formData.restaurantAddress || !formData.restaurantCity || !formData.restaurantCountry) {
          setFormError(t('admin.errors.restaurantFieldsRequired'))
          setFormLoading(false)
          return
        }
      }

      // Create user first
      let newUser = await adminService.createUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
      })

      // Set avatar if uploaded
      if (formData.avatarUrl) {
        try {
          newUser = await adminService.updateUser(newUser.id, { avatarUrl: formData.avatarUrl })
        } catch {
          // Avatar update failed but user was created
        }
      }

      // Add user address if provided
      if (formData.userAddress && formData.userCity && formData.userCountry) {
        try {
          await adminService.addUserAddress(newUser.id, {
            address: formData.userAddress,
            city: formData.userCity,
            country: formData.userCountry,
            postalCode: formData.userPostalCode || undefined,
            latitude: formData.userLatitude,
            longitude: formData.userLongitude,
            isDefault: true,
          })
        } catch {
          // Address creation failed but user was created
        }
      }

      // If role is RESTAURANT_OWNER, create place and restaurant
      if (formData.role === 'RESTAURANT_OWNER') {
        try {
          const newPlace = await adminService.createPlace({
            address: formData.restaurantAddress,
            city: formData.restaurantCity,
            country: formData.restaurantCountry,
            postalCode: formData.restaurantPostalCode || undefined,
            latitude: formData.restaurantLatitude,
            longitude: formData.restaurantLongitude,
          })

          await adminService.createRestaurant({
            name: formData.restaurantName,
            description: formData.restaurantDescription || undefined,
            phone: formData.restaurantPhone || undefined,
            email: formData.restaurantEmail || undefined,
            ownerId: newUser.id,
            placeId: newPlace.id,
          })
        } catch {
          // Restaurant creation failed but user was created
          setFormError(t('admin.errors.userCreatedRestaurantFailed'))
        }
      }

      list.setItems((prev) => [newUser, ...prev])
      modals.setShowCreateModal(false)
      toast.success(t('toast.userCreated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.errors.failedToCreate', { entity: t('admin.users') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      setFormLoading(true)
      setFormError('')
      const updateData: Partial<AdminUser> = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        role: formData.role,
        avatarUrl: formData.avatarUrl || null,
      }
      const updatedUser = await adminService.updateUser(selectedUser.id, updateData)

      // Update or add user address if provided
      if (formData.userAddress && formData.userCity && formData.userCountry) {
        try {
          if (formData.userAddressId) {
            await adminService.updateUserAddress(selectedUser.id, formData.userAddressId, {
              address: formData.userAddress,
              city: formData.userCity,
              country: formData.userCountry,
              postalCode: formData.userPostalCode || undefined,
              latitude: formData.userLatitude,
              longitude: formData.userLongitude,
            })
          } else {
            await adminService.addUserAddress(selectedUser.id, {
              address: formData.userAddress,
              city: formData.userCity,
              country: formData.userCountry,
              postalCode: formData.userPostalCode || undefined,
              latitude: formData.userLatitude,
              longitude: formData.userLongitude,
              isDefault: true,
            })
          }
        } catch {
          // Address update failed but user was updated
        }
      }

      list.setItems((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
      modals.setShowEditModal(false)
      toast.success(t('toast.userUpdated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.errors.failedToUpdate', { entity: t('admin.users') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      setFormLoading(true)
      await adminService.deleteUser(selectedUser.id)
      list.setItems((prev) => prev.filter((u) => u.id !== selectedUser.id))
      modals.setShowDeleteModal(false)
      toast.success(t('toast.userDeleted'))
    } catch (err) {
      list.setError(err instanceof Error ? err.message : t('admin.errors.failedToDelete', { entity: t('admin.users') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  return {
    // Data
    users: list.items, pagination: list.pagination,
    search: list.search, setSearch: list.setSearch,
    filters: list.filters, sort: list.sort,
    isLoading: list.isLoading, error: list.error,
    // Modal states
    showCreateModal: modals.showCreateModal, setShowCreateModal: modals.setShowCreateModal,
    showEditModal: modals.showEditModal, setShowEditModal: modals.setShowEditModal,
    showDeleteModal: modals.showDeleteModal, setShowDeleteModal: modals.setShowDeleteModal,
    showEmailReportModal: modals.showEmailReportModal, setShowEmailReportModal: modals.setShowEmailReportModal,
    selectedUser,
    // Form
    formData, setFormData, formError, formLoading, imageUploading,
    // Handlers
    handleSearch: list.handleSearch, handlePageChange: list.handlePageChange,
    handleLimitChange: list.handleLimitChange, handleSort: list.handleSort,
    handleFilterChange: list.handleFilterChange, handleClearFilters: list.handleClearFilters,
    openCreateModal, openEditModal, openDeleteModal,
    handleCreate, handleUpdate, handleDelete,
    handleAvatarUpload, handleAvatarRemove,
    // Constants
    ROLE_OPTIONS, FILTER_CONFIG,
    // Translation
    t,
  }
}
