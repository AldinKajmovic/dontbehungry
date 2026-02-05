'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/hooks/useLanguage'
import { profileService, MyRestaurant } from '@/services/profile'

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
  const [error, setError] = useState('')

  const isRestaurantOwner = user?.role === 'RESTAURANT_OWNER'

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
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }, [])

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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')

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
    openAddModal,
    openEditModal,
    closeFormModal,
    openViewModal,
    closeViewModal,
    openDeleteModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete,
  }
}
