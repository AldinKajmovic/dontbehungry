'use client'

import { useState, useCallback } from 'react'
import { profileService, MyMenuItem, Category } from '@/services/profile'

interface MenuItemFormState {
  name: string
  description: string
  price: string
  imageUrl: string
  categoryId: string
  isAvailable: boolean
  preparationTime: string
}

const INITIAL_FORM: MenuItemFormState = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  categoryId: '',
  isAvailable: true,
  preparationTime: '',
}

export function useMenuItems(restaurantId: string | null) {
  const [menuItems, setMenuItems] = useState<MyMenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MyMenuItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<MyMenuItem | null>(null)
  const [form, setForm] = useState<MenuItemFormState>(INITIAL_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState('')

  // Pagination and search state
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [search, setSearch] = useState('')

  const loadMenuItems = useCallback(async () => {
    if (!restaurantId) return
    try {
      setLoading(true)
      const [{ items }, { categories: cats }] = await Promise.all([
        profileService.getMyMenuItems(restaurantId),
        profileService.getCategories(),
      ])
      setMenuItems(items)
      setCategories(cats)
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  const openListModal = useCallback(async () => {
    setShowListModal(true)
    setPage(1)
    setSearch('')
    await loadMenuItems()
  }, [loadMenuItems])

  const closeListModal = useCallback(() => {
    setShowListModal(false)
    setMenuItems([])
    setPage(1)
    setSearch('')
  }, [])

  const handleFormChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({ ...prev, [name]: checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }, [])

  const openAddModal = useCallback(() => {
    setEditingItem(null)
    setForm(INITIAL_FORM)
    setError('')
    setShowFormModal(true)
  }, [])

  const openEditModal = useCallback((item: MyMenuItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      categoryId: item.category?.id || '',
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime?.toString() || '',
    })
    setError('')
    setShowFormModal(true)
  }, [])

  const closeFormModal = useCallback(() => {
    setShowFormModal(false)
    setEditingItem(null)
    setError('')
  }, [])

  const openDeleteModal = useCallback((item: MyMenuItem) => {
    setDeletingItem(item)
    setShowDeleteModal(true)
  }, [])

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false)
    setDeletingItem(null)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return

    setFormLoading(true)
    setError('')

    try {
      if (editingItem) {
        const { item } = await profileService.updateMyMenuItem(restaurantId, editingItem.id, {
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          imageUrl: form.imageUrl || null,
          categoryId: form.categoryId || null,
          isAvailable: form.isAvailable,
          preparationTime: form.preparationTime ? parseInt(form.preparationTime, 10) : null,
        })
        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
      } else {
        if (!form.name || !form.price) {
          setError('Name and price are required')
          setFormLoading(false)
          return
        }
        const { item } = await profileService.createMyMenuItem(restaurantId, {
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          imageUrl: form.imageUrl || null,
          categoryId: form.categoryId || null,
          isAvailable: form.isAvailable,
          preparationTime: form.preparationTime ? parseInt(form.preparationTime, 10) : null,
        })
        setMenuItems((prev) => [...prev, item])
      }
      closeFormModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item')
    } finally {
      setFormLoading(false)
    }
  }, [restaurantId, form, editingItem, closeFormModal])

  const handleDelete = useCallback(async () => {
    if (!restaurantId || !deletingItem) return
    setDeleteLoading(true)
    try {
      await profileService.deleteMyMenuItem(restaurantId, deletingItem.id)
      const newItems = menuItems.filter((item) => item.id !== deletingItem.id)
      setMenuItems(newItems)
      // Adjust page if current page becomes empty
      const filteredNewItems = newItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      )
      const newTotalPages = Math.ceil(filteredNewItems.length / perPage)
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages)
      }
      closeDeleteModal()
    } catch {
      // Ignore errors
    } finally {
      setDeleteLoading(false)
    }
  }, [restaurantId, deletingItem, menuItems, search, perPage, page, closeDeleteModal])

  // Filter and paginate items
  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredItems.length / perPage)
  const paginatedItems = filteredItems.slice((page - 1) * perPage, page * perPage)

  return {
    menuItems,
    categories,
    loading,
    showListModal,
    showFormModal,
    showDeleteModal,
    editingItem,
    deletingItem,
    form,
    formLoading,
    deleteLoading,
    error,
    page,
    perPage,
    search,
    filteredItems,
    paginatedItems,
    totalPages,
    setPage,
    setPerPage,
    setSearch,
    handleFormChange,
    openListModal,
    closeListModal,
    openAddModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete,
  }
}
