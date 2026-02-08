'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/hooks/useLanguage'
import { profileService, MyRestaurant, OpeningHoursData, GalleryImageData } from '@/services/profile'
import { CROP_CONFIGS, CropConfig } from '@/components/ui/cropUtils'

interface OpeningHoursEntry {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

function defaultOpeningHours(): OpeningHoursEntry[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '09:00',
    closeTime: '22:00',
    isClosed: false,
  }))
}

interface RestaurantFormState {
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  postalCode: string
  minOrderAmount: string
  deliveryFee: string
  images: string[]
  latitude?: number
  longitude?: number
  openingHours: OpeningHoursEntry[]
}

const INITIAL_FORM: RestaurantFormState = {
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
  latitude: undefined,
  longitude: undefined,
  openingHours: defaultOpeningHours(),
}

export function useRestaurants() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useLanguage()

  const [restaurants, setRestaurants] = useState<MyRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<MyRestaurant | null>(null)
  const [viewingRestaurant, setViewingRestaurant] = useState<MyRestaurant | null>(null)
  const [deletingRestaurant, setDeletingRestaurant] = useState<MyRestaurant | null>(null)
  const [form, setForm] = useState<RestaurantFormState>(INITIAL_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropConfig, setCropConfig] = useState<CropConfig>(CROP_CONFIGS['restaurant-logo'])
  const [error, setError] = useState('')

  const isRestaurantOwner = user?.role === 'RESTAURANT_OWNER'

  // Revoke crop object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load restaurants for owners
  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true)
      const { restaurants: data } = await profileService.getMyRestaurants()
      setRestaurants(data)
    } catch {
      // Ignore errors loading restaurants
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isRestaurantOwner) {
      loadRestaurants()
    }
  }, [isRestaurantOwner, loadRestaurants])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const setImages = useCallback((images: string[]) => {
    setForm((prev) => ({ ...prev, images }))
  }, [])

  const removeImage = useCallback((index: number) => {
    setForm((prev) => {
      const removedUrl = prev.images[index]
      if (removedUrl && removedUrl.startsWith('https://storage.googleapis.com/')) {
        profileService.deleteImage(removedUrl).catch(() => {})
      }
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }
    })
  }, [])

  const onAddImage = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const imageCount = form.images.length
    const config = imageCount === 0
      ? CROP_CONFIGS['restaurant-logo']
      : imageCount === 1
        ? CROP_CONFIGS['restaurant-cover']
        : CROP_CONFIGS['restaurant-gallery']
    setCropConfig(config)
    setCropSrc(URL.createObjectURL(file))
  }, [form.images.length])

  const handleCropConfirm = useCallback(async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)

    setImageUploading(true)
    try {
      const imageCount = form.images.length
      const type = imageCount === 0
        ? 'restaurant-logo' as const
        : imageCount === 1
          ? 'restaurant-cover' as const
          : 'restaurant-gallery' as const
      const entityId = editingRestaurant?.id
      const { url } = await profileService.uploadImage(croppedFile, type, entityId)
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }))
      toast.success(t('upload.success'))
    } catch {
      toast.error(t('upload.failed'))
    } finally {
      setImageUploading(false)
    }
  }, [cropSrc, form.images.length, editingRestaurant, toast, t])

  const handleCropCancel = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }, [cropSrc])

  const handleAddressSelect = useCallback((addr: {
    address: string
    city: string
    state: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
  }) => {
    setForm((prev) => ({
      ...prev,
      address: addr.address,
      city: addr.city,
      country: addr.country,
      postalCode: addr.postalCode,
      latitude: addr.latitude,
      longitude: addr.longitude,
    }))
  }, [])

  const openAddModal = useCallback(() => {
    setEditingRestaurant(null)
    setForm(INITIAL_FORM)
    setError('')
    setShowFormModal(true)
  }, [])

  const openEditModal = useCallback((restaurant: MyRestaurant) => {
    setEditingRestaurant(restaurant)
    const images: string[] = []
    if (restaurant.logoUrl) images.push(restaurant.logoUrl)
    if (restaurant.coverUrl) images.push(restaurant.coverUrl)
    // Add gallery images after logo and cover
    if (restaurant.galleryImages?.length) {
      for (const img of restaurant.galleryImages) {
        images.push(img.imageUrl)
      }
    }

    // Populate opening hours from restaurant data, or use defaults
    const openingHours = restaurant.openingHours?.length
      ? defaultOpeningHours().map((def) => {
          const existing = restaurant.openingHours.find((h) => h.dayOfWeek === def.dayOfWeek)
          return existing
            ? { dayOfWeek: existing.dayOfWeek, openTime: existing.openTime, closeTime: existing.closeTime, isClosed: existing.isClosed }
            : def
        })
      : defaultOpeningHours()

    setForm({
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
      openingHours,
    })
    setError('')
    setShowFormModal(true)
  }, [])

  const closeFormModal = useCallback(() => {
    setShowFormModal(false)
    setEditingRestaurant(null)
    setError('')
  }, [])

  const openViewModal = useCallback((restaurant: MyRestaurant) => {
    setViewingRestaurant(restaurant)
    setShowViewModal(true)
  }, [])

  const closeViewModal = useCallback(() => {
    setShowViewModal(false)
    setViewingRestaurant(null)
  }, [])

  const openDeleteModal = useCallback((restaurant: MyRestaurant) => {
    setDeletingRestaurant(restaurant)
    setShowDeleteModal(true)
  }, [])

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false)
    setDeletingRestaurant(null)
  }, [])

  const setOpeningHours = useCallback((openingHours: OpeningHoursEntry[]) => {
    setForm((prev) => ({ ...prev, openingHours }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')

    // Build gallery images from images[2+]
    const galleryImages: GalleryImageData[] = form.images.slice(2).map((url, i) => ({
      imageUrl: url,
      sortOrder: i,
    }))

    try {
      if (editingRestaurant) {
        const { restaurant } = await profileService.updateMyRestaurant(editingRestaurant.id, {
          name: form.name,
          description: form.description || null,
          phone: form.phone || null,
          email: form.email || null,
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
          deliveryFee: form.deliveryFee ? parseFloat(form.deliveryFee) : null,
          logoUrl: form.images[0] || null,
          coverUrl: form.images[1] || null,
          openingHours: form.openingHours,
          galleryImages,
        })
        setRestaurants((prev) => prev.map((r) => (r.id === restaurant.id ? restaurant : r)))
        toast.success(t('toast.restaurantUpdated'))
      } else {
        if (!form.name || !form.address || !form.city || !form.country) {
          setError('Name, address, city, and country are required')
          setFormLoading(false)
          return
        }
        const { restaurant } = await profileService.createMyRestaurant({
          name: form.name,
          description: form.description || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address,
          city: form.city,
          country: form.country,
          postalCode: form.postalCode || null,
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
          deliveryFee: form.deliveryFee ? parseFloat(form.deliveryFee) : null,
          openingHours: form.openingHours,
          galleryImages,
        })
        setRestaurants((prev) => [...prev, restaurant])
        toast.success(t('toast.restaurantCreated'))
      }
      closeFormModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save restaurant')
    } finally {
      setFormLoading(false)
    }
  }, [form, editingRestaurant, closeFormModal, toast, t])

  const handleDelete = useCallback(async () => {
    if (!deletingRestaurant) return
    setDeleteLoading(true)
    try {
      await profileService.deleteMyRestaurant(deletingRestaurant.id)
      setRestaurants((prev) => prev.filter((r) => r.id !== deletingRestaurant.id))
      closeDeleteModal()
      toast.success(t('toast.restaurantDeleted'))
    } catch {
      // Ignore errors
    } finally {
      setDeleteLoading(false)
    }
  }, [deletingRestaurant, closeDeleteModal, toast, t])

  return {
    restaurants,
    loading,
    isRestaurantOwner,
    showFormModal,
    showViewModal,
    showDeleteModal,
    editingRestaurant,
    viewingRestaurant,
    deletingRestaurant,
    form,
    formLoading,
    deleteLoading,
    error,
    handleChange,
    handleAddressSelect,
    setImages,
    removeImage,
    onAddImage,
    handleImageFileChange,
    handleCropConfirm,
    handleCropCancel,
    cropSrc,
    cropConfig,
    imageInputRef,
    imageUploading,
    openAddModal,
    openEditModal,
    closeFormModal,
    openViewModal,
    closeViewModal,
    openDeleteModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete,
    setOpeningHours,
  }
}
