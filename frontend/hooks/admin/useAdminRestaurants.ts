'use client'

import { useState, useCallback, useRef } from 'react'
import { adminService, AdminRestaurant, RestaurantFilters } from '@/services/admin'
import { profileService } from '@/services/profile'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'
import { useAdminList } from './useAdminList'
import { useAdminModals } from './useAdminModals'
import { CROP_CONFIGS, CropConfig } from '@/components/ui/cropUtils'

interface OpeningHoursEntry {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

interface RestaurantFormData {
  name: string
  description: string
  phone: string
  email: string
  ownerId: string
  placeId: string
  minOrderAmount: string
  deliveryFee: string
  images: string[]
  openingHours: OpeningHoursEntry[]
  createNewPlace: boolean
  newPlaceAddress: string
  newPlaceCity: string
  newPlaceCountry: string
  newPlacePostalCode: string
  newPlaceLatitude: number | undefined
  newPlaceLongitude: number | undefined
}

function defaultOpeningHours(): OpeningHoursEntry[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '09:00',
    closeTime: '22:00',
    isClosed: false,
  }))
}

const EMPTY_FORM: RestaurantFormData = {
  name: '',
  description: '',
  phone: '',
  email: '',
  ownerId: '',
  placeId: '',
  minOrderAmount: '',
  deliveryFee: '',
  images: [],
  openingHours: defaultOpeningHours(),
  createNewPlace: false,
  newPlaceAddress: '',
  newPlaceCity: '',
  newPlaceCountry: '',
  newPlacePostalCode: '',
  newPlaceLatitude: undefined,
  newPlaceLongitude: undefined,
}

function parseOptionalFloat(value: string): number | null {
  if (!value) return null
  const num = parseFloat(value)
  if (isNaN(num) || num < 0) return null
  return num
}

function buildGalleryImages(images: string[]) {
  return images.slice(2).map((url, i) => ({
    imageUrl: url,
    sortOrder: i,
  }))
}

export function useAdminRestaurants() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const fetchFn = useCallback(
    (page: number, limit: number, search?: string, filters?: RestaurantFilters, sort?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
      adminService.getRestaurants(page, limit, search, filters, sort),
    []
  )

  const list = useAdminList<AdminRestaurant, RestaurantFilters>({ fetchFn })
  const modals = useAdminModals()
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null)

  // Form states
  const [formData, setFormData] = useState<RestaurantFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [currentCropConfig, setCurrentCropConfig] = useState<CropConfig>(CROP_CONFIGS['restaurant-logo'])
  const [showImageBrowser, setShowImageBrowser] = useState(false)

  // Validation helper
  const validateRestaurantForm = (data: RestaurantFormData): string | null => {
    if (!data.ownerId) return t('admin.errors.selectOwner')
    if (!data.createNewPlace && !data.placeId) return t('admin.errors.selectPlace')
    if (data.createNewPlace && (!data.newPlaceAddress || !data.newPlaceCity || !data.newPlaceCountry)) {
      return t('admin.errors.placeAddressRequired')
    }
    if (data.minOrderAmount) {
      const val = parseFloat(data.minOrderAmount)
      if (isNaN(val) || val < 0) return t('admin.errors.invalidPrice')
    }
    if (data.deliveryFee) {
      const val = parseFloat(data.deliveryFee)
      if (isNaN(val) || val < 0) return t('admin.errors.invalidPrice')
    }
    return null
  }

  // Resolve place (create new or use existing)
  const resolvePlace = async (data: RestaurantFormData): Promise<string> => {
    if (!data.createNewPlace) return data.placeId
    const newPlace = await adminService.createPlace({
      address: data.newPlaceAddress,
      city: data.newPlaceCity,
      country: data.newPlaceCountry,
      postalCode: data.newPlacePostalCode || undefined,
      latitude: data.newPlaceLatitude,
      longitude: data.newPlaceLongitude,
    })
    return newPlace.id
  }

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM, openingHours: defaultOpeningHours() })
    setFormError('')
    modals.setShowCreateModal(true)
  }

  const openEditModal = async (restaurant: AdminRestaurant) => {
    setFormError('')
    setPrefillLoading(true)
    setFormData({ ...EMPTY_FORM, openingHours: defaultOpeningHours() })
    modals.setShowEditModal(true)
    setSelectedRestaurant(restaurant)

    try {
      const full = await adminService.getRestaurantById(restaurant.id)
      setSelectedRestaurant(full)

      const images = buildEditImages(full)
      const openingHours = full.openingHours?.length
        ? full.openingHours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          }))
        : defaultOpeningHours()

      setFormData({
        name: full.name,
        description: full.description || '',
        phone: full.phone || '',
        email: full.email || '',
        ownerId: full.owner.id,
        placeId: full.place.id,
        minOrderAmount: full.minOrderAmount || '',
        deliveryFee: full.deliveryFee || '',
        images,
        openingHours,
        createNewPlace: false,
        newPlaceAddress: '',
        newPlaceCity: '',
        newPlaceCountry: '',
        newPlacePostalCode: '',
        newPlaceLatitude: undefined,
        newPlaceLongitude: undefined,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.errors.failedToLoad', { entity: t('admin.restaurants') })
      setFormError(message)
      modals.setShowEditModal(false)
      toast.error(t('toast.error'))
    } finally {
      setPrefillLoading(false)
    }
  }

  const openDeleteModal = (restaurant: AdminRestaurant) => {
    setSelectedRestaurant(restaurant)
    modals.setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateRestaurantForm(formData)
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setFormLoading(true)
      setFormError('')
      const placeId = await resolvePlace(formData)
      const galleryImages = buildGalleryImages(formData.images)

      const newRestaurant = await adminService.createRestaurant({
        name: formData.name,
        description: formData.description || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        ownerId: formData.ownerId,
        placeId,
        minOrderAmount: parseOptionalFloat(formData.minOrderAmount) ?? undefined,
        deliveryFee: parseOptionalFloat(formData.deliveryFee) ?? undefined,
        logoUrl: formData.images[0] || null,
        coverUrl: formData.images[1] || null,
        openingHours: formData.openingHours,
        galleryImages,
      })
      list.setItems((prev) => [newRestaurant, ...prev])
      modals.setShowCreateModal(false)
      toast.success(t('toast.restaurantCreated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.errors.failedToCreate', { entity: t('admin.restaurants') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRestaurant) return
    const validationError = validateRestaurantForm(formData)
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setFormLoading(true)
      setFormError('')
      const placeId = await resolvePlace(formData)
      const galleryImages = buildGalleryImages(formData.images)

      const updatedRestaurant = await adminService.updateRestaurant(selectedRestaurant.id, {
        name: formData.name,
        description: formData.description || null,
        phone: formData.phone || null,
        email: formData.email || null,
        ownerId: formData.ownerId,
        placeId,
        minOrderAmount: parseOptionalFloat(formData.minOrderAmount),
        deliveryFee: parseOptionalFloat(formData.deliveryFee),
        logoUrl: formData.images[0] || null,
        coverUrl: formData.images[1] || null,
        openingHours: formData.openingHours,
        galleryImages,
      })
      list.setItems((prev) => prev.map((r) => (r.id === updatedRestaurant.id ? updatedRestaurant : r)))
      modals.setShowEditModal(false)
      toast.success(t('toast.restaurantUpdated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.errors.failedToUpdate', { entity: t('admin.restaurants') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRestaurant) return
    try {
      setFormLoading(true)
      await adminService.deleteRestaurant(selectedRestaurant.id)
      list.setItems((prev) => prev.filter((r) => r.id !== selectedRestaurant.id))
      modals.setShowDeleteModal(false)
      toast.success(t('toast.restaurantDeleted'))
    } catch (err) {
      list.setError(err instanceof Error ? err.message : t('admin.errors.failedToDelete', { entity: t('admin.restaurants') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const imageCount = formData.images.length
    const config = imageCount === 0
      ? CROP_CONFIGS['restaurant-logo']
      : imageCount === 1
        ? CROP_CONFIGS['restaurant-cover']
        : CROP_CONFIGS['restaurant-gallery']
    setCurrentCropConfig(config)
    setCropSrc(URL.createObjectURL(file))
  }

  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)

    setImageUploading(true)
    try {
      const imageCount = formData.images.length
      const type = imageCount === 0
        ? 'restaurant-logo' as const
        : imageCount === 1
          ? 'restaurant-cover' as const
          : 'restaurant-gallery' as const
      const entityId = selectedRestaurant?.id
      const { url } = await profileService.uploadImage(croppedFile, type, entityId)
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }))
      toast.success(t('upload.success'))
    } catch {
      toast.error(t('upload.failed'))
    } finally {
      setImageUploading(false)
    }
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  // Dropdown loaders for SearchableSelect
  const loadOwnerOptions = useCallback((searchTerm: string) => {
    return adminService.getUsersForSelect(searchTerm || undefined)
  }, [])

  const loadPlaceOptions = useCallback((searchTerm: string) => {
    return adminService.getPlacesForSelect(searchTerm || undefined)
  }, [])

  return {
    // Data
    restaurants: list.items, pagination: list.pagination,
    search: list.search, setSearch: list.setSearch,
    filters: list.filters, sort: list.sort,
    isLoading: list.isLoading, error: list.error,
    // Modal states
    showCreateModal: modals.showCreateModal, setShowCreateModal: modals.setShowCreateModal,
    showEditModal: modals.showEditModal, setShowEditModal: modals.setShowEditModal,
    showDeleteModal: modals.showDeleteModal, setShowDeleteModal: modals.setShowDeleteModal,
    showEmailReportModal: modals.showEmailReportModal, setShowEmailReportModal: modals.setShowEmailReportModal,
    showImageBrowser, setShowImageBrowser, selectedRestaurant,
    // Form
    formData, setFormData, formError, formLoading, imageUploading, prefillLoading,
    imageInputRef, cropSrc, setCropSrc, currentCropConfig, setCurrentCropConfig,
    // Handlers
    handleSearch: list.handleSearch, handlePageChange: list.handlePageChange,
    handleLimitChange: list.handleLimitChange, handleSort: list.handleSort,
    handleFilterChange: list.handleFilterChange, handleClearFilters: list.handleClearFilters,
    hasActiveFilters: list.hasActiveFilters,
    openCreateModal, openEditModal, openDeleteModal,
    handleCreate, handleUpdate, handleDelete,
    handleImageFileChange, handleCropConfirm, handleCropCancel,
    loadOwnerOptions, loadPlaceOptions,
    // Translation
    t,
  }
}

// Extract images from a full restaurant for editing
function buildEditImages(full: AdminRestaurant): string[] {
  const images: string[] = []
  if (full.logoUrl) images.push(full.logoUrl)
  if (full.coverUrl) images.push(full.coverUrl)
  if (full.galleryImages?.length) {
    images.push(
      ...full.galleryImages
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((img) => img.imageUrl)
    )
  }
  return images
}
