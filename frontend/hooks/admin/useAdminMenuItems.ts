'use client'

import { useCallback } from 'react'
import { useState } from 'react'
import { adminService, AdminMenuItem, MenuItemFilters } from '@/services/admin'
import { profileService } from '@/services/profile'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'
import { useAdminList } from './useAdminList'
import { useAdminModals } from './useAdminModals'

interface MenuItemFormData {
  name: string
  description: string
  price: string
  imageUrl: string
  restaurantId: string
  categoryId: string
  isAvailable: boolean
  preparationTime: string
}

const EMPTY_FORM: MenuItemFormData = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  restaurantId: '',
  categoryId: '',
  isAvailable: true,
  preparationTime: '',
}

function parsePositiveFloat(value: string): number | undefined {
  if (!value) return undefined
  const num = parseFloat(value)
  if (isNaN(num) || num < 0) return undefined
  return num
}

function parsePositiveInt(value: string): number | undefined {
  if (!value) return undefined
  const num = parseInt(value, 10)
  if (isNaN(num) || num < 0) return undefined
  return num
}

export function useAdminMenuItems() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const AVAILABILITY_OPTIONS = [
    { value: '', label: t('admin.menuItemsPage.allItems') },
    { value: 'true', label: t('admin.menuItemsPage.available') },
    { value: 'false', label: t('admin.menuItemsPage.unavailable') },
  ]

  const fetchFn = useCallback(
    (page: number, limit: number, search?: string, filters?: MenuItemFilters, sort?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
      adminService.getMenuItems(page, limit, search, filters, sort),
    []
  )

  const list = useAdminList<AdminMenuItem, MenuItemFilters>({ fetchFn })
  const modals = useAdminModals()
  const [selectedItem, setSelectedItem] = useState<AdminMenuItem | null>(null)

  // Form states
  const [formData, setFormData] = useState<MenuItemFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    try {
      const { url } = await profileService.uploadImage(file, 'menu-item')
      setFormData((prev) => ({ ...prev, imageUrl: url }))
      toast.success(t('upload.success'))
      return url
    } catch {
      toast.error(t('upload.failed'))
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const handleImageRemove = () => {
    const oldUrl = formData.imageUrl
    if (oldUrl && oldUrl.startsWith('https://storage.googleapis.com/')) {
      profileService.deleteImage(oldUrl).catch(() => {})
    }
    setFormData((prev) => ({ ...prev, imageUrl: '' }))
  }

  const openCreateModal = () => {
    setFormData(EMPTY_FORM)
    setFormError('')
    modals.setShowCreateModal(true)
  }

  const openEditModal = (item: AdminMenuItem) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      restaurantId: item.restaurant.id,
      categoryId: item.category?.id || '',
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime?.toString() || '',
    })
    setFormError('')
    modals.setShowEditModal(true)
  }

  const openDeleteModal = (item: AdminMenuItem) => {
    setSelectedItem(item)
    modals.setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.restaurantId) {
      setFormError(t('admin.menuItemsPage.selectRestaurant'))
      return
    }
    const price = parsePositiveFloat(formData.price)
    if (price === undefined) {
      setFormError(t('admin.errors.invalidPrice'))
      return
    }
    try {
      setFormLoading(true)
      setFormError('')
      const newItem = await adminService.createMenuItem({
        name: formData.name,
        description: formData.description || undefined,
        price,
        imageUrl: formData.imageUrl || undefined,
        restaurantId: formData.restaurantId,
        categoryId: formData.categoryId || undefined,
        isAvailable: formData.isAvailable,
        preparationTime: parsePositiveInt(formData.preparationTime),
      })
      list.setItems((prev) => [newItem, ...prev])
      modals.setShowCreateModal(false)
      toast.success(t('toast.menuItemSaved'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.errors.failedToCreate', { entity: t('admin.menuItems') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    const price = parsePositiveFloat(formData.price)
    if (price === undefined) {
      setFormError(t('admin.errors.invalidPrice'))
      return
    }
    try {
      setFormLoading(true)
      setFormError('')
      const updatedItem = await adminService.updateMenuItem(selectedItem.id, {
        name: formData.name,
        description: formData.description || null,
        price,
        imageUrl: formData.imageUrl || null,
        restaurantId: formData.restaurantId || undefined,
        categoryId: formData.categoryId || null,
        isAvailable: formData.isAvailable,
        preparationTime: parsePositiveInt(formData.preparationTime) ?? null,
      })
      list.setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
      modals.setShowEditModal(false)
      toast.success(t('toast.menuItemSaved'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.errors.failedToUpdate', { entity: t('admin.menuItems') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    try {
      setFormLoading(true)
      await adminService.deleteMenuItem(selectedItem.id)
      list.setItems((prev) => prev.filter((item) => item.id !== selectedItem.id))
      modals.setShowDeleteModal(false)
      toast.success(t('toast.menuItemDeleted'))
    } catch (err) {
      list.setError(err instanceof Error ? err.message : t('admin.errors.failedToDelete', { entity: t('admin.menuItems') }))
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  // Dropdown loaders for SearchableSelect
  const loadRestaurantOptions = useCallback((searchTerm: string) => {
    return adminService.getRestaurantsForSelect(searchTerm || undefined)
  }, [])

  const loadCategoryOptions = useCallback((searchTerm: string) => {
    return adminService.getCategoriesForSelect(searchTerm || undefined)
  }, [])

  return {
    // Data
    menuItems: list.items, pagination: list.pagination,
    search: list.search, setSearch: list.setSearch,
    filters: list.filters, sort: list.sort,
    isLoading: list.isLoading, error: list.error,
    // Modal states
    showCreateModal: modals.showCreateModal, setShowCreateModal: modals.setShowCreateModal,
    showEditModal: modals.showEditModal, setShowEditModal: modals.setShowEditModal,
    showDeleteModal: modals.showDeleteModal, setShowDeleteModal: modals.setShowDeleteModal,
    showEmailReportModal: modals.showEmailReportModal, setShowEmailReportModal: modals.setShowEmailReportModal,
    selectedItem,
    // Form
    formData, setFormData, formError, formLoading, imageUploading,
    // Handlers
    handleSearch: list.handleSearch, handlePageChange: list.handlePageChange,
    handleLimitChange: list.handleLimitChange, handleSort: list.handleSort,
    handleFilterChange: list.handleFilterChange, handleClearFilters: list.handleClearFilters,
    hasActiveFilters: list.hasActiveFilters,
    openCreateModal, openEditModal, openDeleteModal,
    handleCreate, handleUpdate, handleDelete,
    handleImageUpload, handleImageRemove,
    loadRestaurantOptions, loadCategoryOptions,
    // Constants
    AVAILABILITY_OPTIONS,
    // Translation
    t,
  }
}
