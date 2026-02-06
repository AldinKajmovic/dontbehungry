import { useState, useCallback } from 'react'
import { adminService, AdminOrder, AdminOrderItem, PaginationInfo, OrderFilters, SortParams } from '@/services/admin'

export interface CreateOrderItem {
  id: string
  menuItemId: string
  menuItemName: string
  menuItemPrice: number
  quantity: number
  notes: string
}

export interface OrderFormData {
  status: string
  driverId: string
  notes: string
}

export interface CreateFormData {
  userId: string
  restaurantId: string
  deliveryPlaceId: string
  driverId: string
  status: string
  subtotal: string
  deliveryFee: string
  tax: string
  notes: string
}

export interface EditItemData {
  quantity: string
  notes: string
}

export interface NewItemData {
  menuItemId: string
  quantity: string
  notes: string
}

export interface CreateNewItemData {
  menuItemId: string
  menuItemLabel: string
  quantity: string
  notes: string
}

const initialCreateFormData: CreateFormData = {
  userId: '',
  restaurantId: '',
  deliveryPlaceId: '',
  driverId: '',
  status: 'PENDING',
  subtotal: '',
  deliveryFee: '',
  tax: '',
  notes: '',
}

export function useOrdersCRUD() {
  // Data state
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<OrderFilters>({})
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEmailReportModal, setShowEmailReportModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)

  // Form states
  const [formData, setFormData] = useState<OrderFormData>({ status: '', driverId: '', notes: '' })
  const [createFormData, setCreateFormData] = useState<CreateFormData>(initialCreateFormData)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Order items state (for edit modal)
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([])
  const [orderItemsLoading, setOrderItemsLoading] = useState(false)
  const [showAddItemForm, setShowAddItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [newItemData, setNewItemData] = useState<NewItemData>({ menuItemId: '', quantity: '1', notes: '' })
  const [editItemData, setEditItemData] = useState<EditItemData>({ quantity: '', notes: '' })

  // Order items state (for create modal)
  const [createOrderItems, setCreateOrderItems] = useState<CreateOrderItem[]>([])
  const [showCreateAddItemForm, setShowCreateAddItemForm] = useState(false)
  const [createEditingItemId, setCreateEditingItemId] = useState<string | null>(null)
  const [createNewItemData, setCreateNewItemData] = useState<CreateNewItemData>({ menuItemId: '', menuItemLabel: '', quantity: '1', notes: '' })
  const [createEditItemData, setCreateEditItemData] = useState<EditItemData>({ quantity: '', notes: '' })

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await adminService.getOrders(
        pagination.page,
        pagination.limit,
        search || undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort.sortBy ? sort : undefined
      )
      setOrders(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, filters, sort])

  // Handlers
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSort({ sortBy, sortOrder })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined }
      Object.keys(next).forEach((k) => {
        if (!next[k as keyof OrderFilters]) delete next[k as keyof OrderFilters]
      })
      return next
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadOrders()
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit }))
  }

  // Modal openers
  const openCreateModal = () => {
    setCreateFormData(initialCreateFormData)
    setCreateOrderItems([])
    setShowCreateAddItemForm(false)
    setCreateEditingItemId(null)
    setCreateNewItemData({ menuItemId: '', menuItemLabel: '', quantity: '1', notes: '' })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = async (order: AdminOrder) => {
    setSelectedOrder(order)
    setFormData({
      status: order.status,
      driverId: order.driver?.id || '',
      notes: order.notes || '',
    })
    setFormError('')
    setShowEditModal(true)
    setShowAddItemForm(false)
    setEditingItemId(null)
    setNewItemData({ menuItemId: '', quantity: '1', notes: '' })

    setOrderItemsLoading(true)
    try {
      const items = order.orderItems || await adminService.getOrderItems(order.id)
      setOrderItems(items)
    } catch {
      setOrderItems([])
    } finally {
      setOrderItemsLoading(false)
    }
  }

  const openDeleteModal = (order: AdminOrder) => {
    setSelectedOrder(order)
    setShowDeleteModal(true)
  }

  // CRUD operations
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormLoading(true)
      setFormError('')

      const itemsSubtotal = createOrderItems.reduce(
        (sum, item) => sum + item.menuItemPrice * item.quantity,
        0
      )
      const subtotal = createOrderItems.length > 0 ? itemsSubtotal : (parseFloat(createFormData.subtotal) || 0)

      const newOrder = await adminService.createOrder({
        userId: createFormData.userId,
        restaurantId: createFormData.restaurantId,
        deliveryPlaceId: createFormData.deliveryPlaceId,
        driverId: createFormData.driverId || null,
        status: createFormData.status,
        subtotal,
        deliveryFee: createFormData.deliveryFee ? parseFloat(createFormData.deliveryFee) : undefined,
        tax: createFormData.tax ? parseFloat(createFormData.tax) : undefined,
        notes: createFormData.notes || null,
      })

      if (createOrderItems.length > 0) {
        for (const item of createOrderItems) {
          await adminService.addOrderItem(newOrder.id, {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes || null,
          })
        }
        const updatedOrder = await adminService.getOrderById(newOrder.id)
        setOrders((prev) => [updatedOrder, ...prev.filter((o) => o.id !== newOrder.id)])
      } else {
        setOrders((prev) => [newOrder, ...prev])
      }

      setShowCreateModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    try {
      setFormLoading(true)
      setFormError('')
      const updatedOrder = await adminService.updateOrder(selectedOrder.id, {
        status: formData.status,
        driverId: formData.driverId || null,
        notes: formData.notes || undefined,
      })
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
      setShowEditModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedOrder) return
    try {
      setFormLoading(true)
      await adminService.deleteOrder(selectedOrder.id)
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id))
      setShowDeleteModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order')
    } finally {
      setFormLoading(false)
    }
  }

  // Order items handlers (edit modal)
  const handleAddItem = async () => {
    if (!selectedOrder || !newItemData.menuItemId) return
    try {
      setOrderItemsLoading(true)
      const newItem = await adminService.addOrderItem(selectedOrder.id, {
        menuItemId: newItemData.menuItemId,
        quantity: parseInt(newItemData.quantity) || 1,
        notes: newItemData.notes || null,
      })
      setOrderItems((prev) => [...prev, newItem])
      setShowAddItemForm(false)
      setNewItemData({ menuItemId: '', quantity: '1', notes: '' })
      const updatedOrder = await adminService.getOrderById(selectedOrder.id)
      setSelectedOrder(updatedOrder)
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setOrderItemsLoading(false)
    }
  }

  const handleUpdateItem = async (itemId: string) => {
    if (!selectedOrder) return
    try {
      setOrderItemsLoading(true)
      const updatedItem = await adminService.updateOrderItem(selectedOrder.id, itemId, {
        quantity: parseInt(editItemData.quantity) || undefined,
        notes: editItemData.notes || null,
      })
      setOrderItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)))
      setEditingItemId(null)
      const updatedOrder = await adminService.getOrderById(selectedOrder.id)
      setSelectedOrder(updatedOrder)
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setOrderItemsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedOrder) return
    try {
      setOrderItemsLoading(true)
      await adminService.deleteOrderItem(selectedOrder.id, itemId)
      setOrderItems((prev) => prev.filter((item) => item.id !== itemId))
      const updatedOrder = await adminService.getOrderById(selectedOrder.id)
      setSelectedOrder(updatedOrder)
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete item')
    } finally {
      setOrderItemsLoading(false)
    }
  }

  const startEditItem = (item: AdminOrderItem) => {
    setEditingItemId(item.id)
    setEditItemData({
      quantity: item.quantity.toString(),
      notes: item.notes || '',
    })
  }

  // Auto-fill subtotal and tax from items
  const updateSubtotalAndTax = (items: CreateOrderItem[]) => {
    if (items.length === 0) {
      setCreateFormData((prev) => ({ ...prev, subtotal: '', tax: '' }))
      return
    }
    const subtotal = items.reduce((sum, item) => sum + item.menuItemPrice * item.quantity, 0)
    const tax = subtotal * 0.2
    setCreateFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
    }))
  }

  // Create order items handlers (local state)
  const handleCreateAddItem = () => {
    if (!createNewItemData.menuItemId || !createNewItemData.menuItemLabel) return

    const priceMatch = createNewItemData.menuItemLabel.match(/\$(\d+\.?\d*)/)
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0
    const name = createNewItemData.menuItemLabel.replace(/\s*\(\$[\d.]+\)$/, '')

    const newItem: CreateOrderItem = {
      id: `temp-${Date.now()}`,
      menuItemId: createNewItemData.menuItemId,
      menuItemName: name,
      menuItemPrice: price,
      quantity: parseInt(createNewItemData.quantity) || 1,
      notes: createNewItemData.notes,
    }

    setCreateOrderItems((prev) => {
      const updated = [...prev, newItem]
      updateSubtotalAndTax(updated)
      return updated
    })
    setShowCreateAddItemForm(false)
    setCreateNewItemData({ menuItemId: '', menuItemLabel: '', quantity: '1', notes: '' })
  }

  const handleCreateUpdateItem = (itemId: string) => {
    setCreateOrderItems((prev) => {
      const updated = prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: parseInt(createEditItemData.quantity) || item.quantity,
              notes: createEditItemData.notes,
            }
          : item
      )
      updateSubtotalAndTax(updated)
      return updated
    })
    setCreateEditingItemId(null)
  }

  const handleCreateDeleteItem = (itemId: string) => {
    setCreateOrderItems((prev) => {
      const updated = prev.filter((item) => item.id !== itemId)
      updateSubtotalAndTax(updated)
      return updated
    })
  }

  const startCreateEditItem = (item: CreateOrderItem) => {
    setCreateEditingItemId(item.id)
    setCreateEditItemData({
      quantity: item.quantity.toString(),
      notes: item.notes || '',
    })
  }

  // Calculate totals
  const createOrderSubtotal = createOrderItems.reduce(
    (sum, item) => sum + item.menuItemPrice * item.quantity,
    0
  )

  const hasActiveFilters = Object.keys(filters).length > 0

  // Option loaders
  const loadDriverOptions = useCallback((searchTerm: string) => {
    return adminService.getDriversForSelect(searchTerm || undefined)
  }, [])

  const loadCustomerOptions = useCallback((searchTerm: string) => {
    return adminService.getUsersForSelect(searchTerm || undefined)
  }, [])

  const loadRestaurantOptions = useCallback((searchTerm: string) => {
    return adminService.getRestaurantsForSelect(searchTerm || undefined)
  }, [])

  const loadPlaceOptions = useCallback((searchTerm: string) => {
    return adminService.getPlacesForSelect(searchTerm || undefined)
  }, [])

  const loadMenuItemOptions = useCallback((searchTerm: string) => {
    if (!selectedOrder) return Promise.resolve([])
    return adminService.getMenuItemsForSelect(selectedOrder.restaurant.id, searchTerm || undefined)
  }, [selectedOrder])

  const loadCreateMenuItemOptions = useCallback((searchTerm: string) => {
    if (!createFormData.restaurantId) return Promise.resolve([])
    return adminService.getMenuItemsForSelect(createFormData.restaurantId, searchTerm || undefined)
  }, [createFormData.restaurantId])

  return {
    // Data
    orders,
    pagination,
    search,
    filters,
    sort,
    isLoading,
    error,
    hasActiveFilters,

    // Modal states
    showCreateModal,
    showEditModal,
    showDeleteModal,
    showEmailReportModal,
    selectedOrder,
    setShowCreateModal,
    setShowEditModal,
    setShowDeleteModal,
    setShowEmailReportModal,

    // Form states
    formData,
    setFormData,
    createFormData,
    setCreateFormData,
    formError,
    formLoading,

    // Order items (edit)
    orderItems,
    orderItemsLoading,
    showAddItemForm,
    setShowAddItemForm,
    editingItemId,
    setEditingItemId,
    newItemData,
    setNewItemData,
    editItemData,
    setEditItemData,

    // Order items (create)
    createOrderItems,
    setCreateOrderItems,
    showCreateAddItemForm,
    setShowCreateAddItemForm,
    createEditingItemId,
    setCreateEditingItemId,
    createNewItemData,
    setCreateNewItemData,
    createEditItemData,
    setCreateEditItemData,
    createOrderSubtotal,

    // Handlers
    setSearch,
    loadOrders,
    handleSort,
    handleFilterChange,
    handleClearFilters,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAddItem,
    handleUpdateItem,
    handleDeleteItem,
    startEditItem,
    handleCreateAddItem,
    handleCreateUpdateItem,
    handleCreateDeleteItem,
    startCreateEditItem,

    // Option loaders
    loadDriverOptions,
    loadCustomerOptions,
    loadRestaurantOptions,
    loadPlaceOptions,
    loadMenuItemOptions,
    loadCreateMenuItemOptions,
  }
}
