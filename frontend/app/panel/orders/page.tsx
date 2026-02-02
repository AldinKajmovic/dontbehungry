'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { RangeFilter } from '@/components/admin/RangeFilter'
import { StatusSelect, ORDER_STATUS_OPTIONS } from '@/components/admin/StatusSelect'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Modal, Button, Alert, SearchableSelect } from '@/components/ui'
import { adminService, AdminOrder, AdminOrderItem, PaginationInfo, OrderFilters, SortParams } from '@/services/admin'

// Convert ORDER_STATUS_OPTIONS to a color map for table badges
const STATUS_COLORS: Record<string, string> = Object.fromEntries(
  ORDER_STATUS_OPTIONS.map((opt) => [opt.value, opt.colorClass])
)

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payments' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...ORDER_STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
]

export default function OrdersPage() {
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
  const [formData, setFormData] = useState({
    status: '',
    driverId: '',
    notes: '',
  })
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    restaurantId: '',
    deliveryPlaceId: '',
    driverId: '',
    status: 'PENDING',
    subtotal: '',
    deliveryFee: '',
    tax: '',
    notes: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Order items state (for edit modal)
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([])
  const [orderItemsLoading, setOrderItemsLoading] = useState(false)
  const [showAddItemForm, setShowAddItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [newItemData, setNewItemData] = useState({ menuItemId: '', quantity: '1', notes: '' })
  const [editItemData, setEditItemData] = useState({ quantity: '', notes: '' })

  // Order items state (for create modal - local items before order is created)
  interface CreateOrderItem {
    id: string // temporary id for local state management
    menuItemId: string
    menuItemName: string
    menuItemPrice: number
    quantity: number
    notes: string
  }
  const [createOrderItems, setCreateOrderItems] = useState<CreateOrderItem[]>([])
  const [showCreateAddItemForm, setShowCreateAddItemForm] = useState(false)
  const [createEditingItemId, setCreateEditingItemId] = useState<string | null>(null)
  const [createNewItemData, setCreateNewItemData] = useState({ menuItemId: '', menuItemLabel: '', quantity: '1', notes: '' })
  const [createEditItemData, setCreateEditItemData] = useState({ quantity: '', notes: '' })

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

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

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

  const hasActiveFilters = Object.keys(filters).length > 0

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

  const openCreateModal = () => {
    setCreateFormData({
      userId: '',
      restaurantId: '',
      deliveryPlaceId: '',
      driverId: '',
      status: 'PENDING',
      subtotal: '',
      deliveryFee: '',
      tax: '',
      notes: '',
    })
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

    // Load order items
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormLoading(true)
      setFormError('')

      // Calculate subtotal from items if items exist
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

      // Add order items if any
      if (createOrderItems.length > 0) {
        for (const item of createOrderItems) {
          await adminService.addOrderItem(newOrder.id, {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes || null,
          })
        }
        // Reload the order to get updated totals and items
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

  // Order Items handlers
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
      // Reload order to get updated totals
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
      // Reload order to get updated totals
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
      // Reload order to get updated totals
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

  // Create Order Items handlers (local state management before order is created)
  const handleCreateAddItem = () => {
    if (!createNewItemData.menuItemId || !createNewItemData.menuItemLabel) return

    // Parse price from label (format: "Item Name ($XX.XX)")
    const priceMatch = createNewItemData.menuItemLabel.match(/\$(\d+\.?\d*)/)
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0

    // Extract item name from label
    const name = createNewItemData.menuItemLabel.replace(/\s*\(\$[\d.]+\)$/, '')

    const newItem: CreateOrderItem = {
      id: `temp-${Date.now()}`,
      menuItemId: createNewItemData.menuItemId,
      menuItemName: name,
      menuItemPrice: price,
      quantity: parseInt(createNewItemData.quantity) || 1,
      notes: createNewItemData.notes,
    }

    setCreateOrderItems((prev) => [...prev, newItem])
    setShowCreateAddItemForm(false)
    setCreateNewItemData({ menuItemId: '', menuItemLabel: '', quantity: '1', notes: '' })
  }

  const handleCreateUpdateItem = (itemId: string) => {
    setCreateOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: parseInt(createEditItemData.quantity) || item.quantity,
              notes: createEditItemData.notes,
            }
          : item
      )
    )
    setCreateEditingItemId(null)
  }

  const handleCreateDeleteItem = (itemId: string) => {
    setCreateOrderItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const startCreateEditItem = (item: CreateOrderItem) => {
    setCreateEditingItemId(item.id)
    setCreateEditItemData({
      quantity: item.quantity.toString(),
      notes: item.notes || '',
    })
  }

  // Calculate create order totals
  const createOrderSubtotal = createOrderItems.reduce(
    (sum, item) => sum + item.menuItemPrice * item.quantity,
    0
  )

  // Dropdown loaders for SearchableSelect
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

  const columns = [
    {
      key: 'id',
      header: 'Order',
      render: (order: AdminOrder) => (
        <div>
          <p className="font-medium text-gray-900 font-mono text-sm">{order.id.slice(0, 8)}...</p>
          <p className="text-xs text-gray-500">{order.restaurant.name}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Customer',
      render: (order: AdminOrder) => (
        <div>
          <p className="text-sm">{order.user.firstName} {order.user.lastName}</p>
          <p className="text-xs text-gray-500">{order.user.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (order: AdminOrder) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (order: AdminOrder) => (
        <span className="text-sm text-gray-600">
          {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      sortable: true,
      render: (order: AdminOrder) => (
        <span className="font-medium">${parseFloat(order.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (order: AdminOrder) => (
        order.payment ? (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            order.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            order.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
            order.payment.status === 'REFUNDED' ? 'bg-blue-100 text-blue-700' :
            'bg-red-100 text-red-700'
          }`}>
            {order.payment.status}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (order: AdminOrder) => (
        order.driver ? (
          <span className="text-sm">{order.driver.firstName} {order.driver.lastName}</span>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        )
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (order: AdminOrder) => (
        <span className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="orders"
            filters={filters}
            onEmailClick={() => setShowEmailReportModal(true)}
          />
          <Button onClick={openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Order
            </span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or customer email..."
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            Search
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <SearchableSelect
              label="Customer"
              id="filter-customer"
              value={filters.customerId || ''}
              onChange={(value) => handleFilterChange('customerId', value)}
              loadOptions={loadCustomerOptions}
              placeholder="All Customers"
              emptyMessage="No customers found"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
            <select
              value={filters.paymentStatus || ''}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <RangeFilter
            label="Total Amount"
            minValue={filters.minTotalAmount || ''}
            maxValue={filters.maxTotalAmount || ''}
            onMinChange={(value) => handleFilterChange('minTotalAmount', value)}
            onMaxChange={(value) => handleFilterChange('maxTotalAmount', value)}
            min={0}
            max={1000}
            step={1}
            prefix="$"
          />
          <div className="min-w-[280px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.createdAtFrom || ''}
                onChange={(e) => handleFilterChange('createdAtFrom', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={filters.createdAtTo || ''}
                onChange={(e) => handleFilterChange('createdAtTo', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
            </div>
          </div>
          <div className="min-w-[200px]">
            <SearchableSelect
              label="Driver"
              id="filter-driver"
              value={filters.driverId || ''}
              onChange={(value) => handleFilterChange('driverId', value)}
              loadOptions={loadDriverOptions}
              placeholder="All Drivers"
              emptyMessage="No drivers found"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No orders found"
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(order) => (
          <>
            <button
              onClick={() => openEditModal(order)}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(order)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      />

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Order"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          {/* Order Info */}
          {selectedOrder && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Order ID:</span>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p>{selectedOrder.user.firstName} {selectedOrder.user.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Restaurant:</span>
                  <p>{selectedOrder.restaurant.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-medium">${parseFloat(selectedOrder.totalAmount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Items Section */}
          {selectedOrder && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Order Items</h3>
                {!showAddItemForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddItemForm(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                )}
              </div>

              {/* Add Item Form */}
              {showAddItemForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="space-y-3">
                    <SearchableSelect
                      key={`menu-item-select-${selectedOrder?.restaurant.id}`}
                      label="Menu Item"
                      id="new-item-menuItemId"
                      value={newItemData.menuItemId}
                      onChange={(value) => setNewItemData({ ...newItemData, menuItemId: value })}
                      loadOptions={loadMenuItemOptions}
                      placeholder="Select menu item..."
                      emptyMessage="No menu items found for this restaurant"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={newItemData.quantity}
                          onChange={(e) => setNewItemData({ ...newItemData, quantity: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <input
                          type="text"
                          value={newItemData.notes}
                          onChange={(e) => setNewItemData({ ...newItemData, notes: e.target.value })}
                          className="input-field"
                          placeholder="Optional..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={orderItemsLoading || !newItemData.menuItemId}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {orderItemsLoading ? 'Adding...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddItemForm(false)
                          setNewItemData({ menuItemId: '', quantity: '1', notes: '' })
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              {orderItemsLoading && orderItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Loading items...</div>
              ) : orderItems.length === 0 ? (
                <div className="text-center py-4 text-gray-400">No items in this order</div>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3">
                      {editingItemId === item.id ? (
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menuItem.name}</p>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={editItemData.quantity}
                            onChange={(e) => setEditItemData({ ...editItemData, quantity: e.target.value })}
                            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded"
                          />
                          <input
                            type="text"
                            value={editItemData.notes}
                            onChange={(e) => setEditItemData({ ...editItemData, notes: e.target.value })}
                            className="w-32 px-2 py-1 text-sm border border-gray-200 rounded"
                            placeholder="Notes..."
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id)}
                            disabled={orderItemsLoading}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menuItem.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} x ${parseFloat(item.unitPrice).toFixed(2)}
                              {item.notes && <span className="ml-2 italic">({item.notes})</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">${parseFloat(item.totalPrice).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => startEditItem(item)}
                              className="p-1 text-gray-400 hover:text-primary-600"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={orderItemsLoading}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              {orderItems.length > 0 && selectedOrder && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee:</span>
                    <span>${parseFloat(selectedOrder.deliveryFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax:</span>
                    <span>${parseFloat(selectedOrder.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium mt-1 pt-1 border-t border-gray-100">
                    <span>Total:</span>
                    <span>${parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <StatusSelect
            label="Status"
            id="status"
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
            options={ORDER_STATUS_OPTIONS}
          />

          <SearchableSelect
            label="Driver"
            id="driverId"
            value={formData.driverId}
            onChange={(value) => setFormData({ ...formData, driverId: value })}
            loadOptions={loadDriverOptions}
            placeholder="Unassigned"
            emptyMessage="No drivers found"
            initialLabel={selectedOrder?.driver && formData.driverId ? `${selectedOrder.driver.firstName} ${selectedOrder.driver.lastName}` : ''}
            hint="(optional - leave empty for Unassigned)"
          />

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="input-field resize-none"
              placeholder="Order notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Order"
        message={`Are you sure you want to delete order ${selectedOrder?.id.slice(0, 8)}...? This action cannot be undone.`}
        isLoading={formLoading}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Order"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <SearchableSelect
            label="Customer"
            id="create-userId"
            value={createFormData.userId}
            onChange={(value) => setCreateFormData({ ...createFormData, userId: value })}
            loadOptions={loadCustomerOptions}
            placeholder="Select customer..."
            emptyMessage="No customers found"
          />

          <SearchableSelect
            label="Restaurant"
            id="create-restaurantId"
            value={createFormData.restaurantId}
            onChange={(value) => {
              setCreateFormData({ ...createFormData, restaurantId: value })
              // Clear items when restaurant changes
              setCreateOrderItems([])
              setShowCreateAddItemForm(false)
            }}
            loadOptions={loadRestaurantOptions}
            placeholder="Select restaurant..."
            emptyMessage="No restaurants found"
          />

          {/* Order Items Section - Only show when restaurant is selected */}
          {createFormData.restaurantId && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Order Items</h3>
                {!showCreateAddItemForm && (
                  <button
                    type="button"
                    onClick={() => setShowCreateAddItemForm(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                )}
              </div>

              {/* Add Item Form */}
              {showCreateAddItemForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="space-y-3">
                    <SearchableSelect
                      key={`create-menu-item-select-${createFormData.restaurantId}`}
                      label="Menu Item"
                      id="create-new-item-menuItemId"
                      value={createNewItemData.menuItemId}
                      onChange={(value, label) => setCreateNewItemData({ ...createNewItemData, menuItemId: value, menuItemLabel: label || '' })}
                      loadOptions={loadCreateMenuItemOptions}
                      placeholder="Select menu item..."
                      emptyMessage="No menu items found for this restaurant"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={createNewItemData.quantity}
                          onChange={(e) => setCreateNewItemData({ ...createNewItemData, quantity: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <input
                          type="text"
                          value={createNewItemData.notes}
                          onChange={(e) => setCreateNewItemData({ ...createNewItemData, notes: e.target.value })}
                          className="input-field"
                          placeholder="Optional..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateAddItem}
                        disabled={!createNewItemData.menuItemId}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateAddItemForm(false)
                          setCreateNewItemData({ menuItemId: '', menuItemLabel: '', quantity: '1', notes: '' })
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              {createOrderItems.length === 0 ? (
                <div className="text-center py-4 text-gray-400">No items added yet</div>
              ) : (
                <div className="space-y-2">
                  {createOrderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3">
                      {createEditingItemId === item.id ? (
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menuItemName}</p>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={createEditItemData.quantity}
                            onChange={(e) => setCreateEditItemData({ ...createEditItemData, quantity: e.target.value })}
                            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded"
                          />
                          <input
                            type="text"
                            value={createEditItemData.notes}
                            onChange={(e) => setCreateEditItemData({ ...createEditItemData, notes: e.target.value })}
                            className="w-32 px-2 py-1 text-sm border border-gray-200 rounded"
                            placeholder="Notes..."
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateUpdateItem(item.id)}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreateEditingItemId(null)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menuItemName}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} x ${item.menuItemPrice.toFixed(2)}
                              {item.notes && <span className="ml-2 italic">({item.notes})</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">${(item.menuItemPrice * item.quantity).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => startCreateEditItem(item)}
                              className="p-1 text-gray-400 hover:text-primary-600"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateDeleteItem(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              {createOrderItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Items Subtotal:</span>
                    <span>${createOrderSubtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <SearchableSelect
            label="Delivery Address"
            id="create-deliveryPlaceId"
            value={createFormData.deliveryPlaceId}
            onChange={(value) => setCreateFormData({ ...createFormData, deliveryPlaceId: value })}
            loadOptions={loadPlaceOptions}
            placeholder="Select delivery address..."
            emptyMessage="No addresses found"
          />

          <SearchableSelect
            label="Driver"
            id="create-driverId"
            value={createFormData.driverId}
            onChange={(value) => setCreateFormData({ ...createFormData, driverId: value })}
            loadOptions={loadDriverOptions}
            placeholder="Unassigned"
            emptyMessage="No drivers found"
            hint="(optional - leave empty for Unassigned)"
          />

          <StatusSelect
            label="Status"
            id="create-status"
            value={createFormData.status}
            onValueChange={(value) => setCreateFormData({ ...createFormData, status: value })}
            options={ORDER_STATUS_OPTIONS}
          />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="create-subtotal" className="block text-sm font-medium text-gray-700 mb-2">
                Subtotal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="create-subtotal"
                  step="0.01"
                  min="0"
                  value={createFormData.subtotal}
                  onChange={(e) => setCreateFormData({ ...createFormData, subtotal: e.target.value })}
                  className="input-field pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="create-deliveryFee" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Fee <span className="text-gray-400 font-normal">(opt)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="create-deliveryFee"
                  step="0.01"
                  min="0"
                  value={createFormData.deliveryFee}
                  onChange={(e) => setCreateFormData({ ...createFormData, deliveryFee: e.target.value })}
                  className="input-field pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="create-tax" className="block text-sm font-medium text-gray-700 mb-2">
                Tax <span className="text-gray-400 font-normal">(opt)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="create-tax"
                  step="0.01"
                  min="0"
                  value={createFormData.tax}
                  onChange={(e) => setCreateFormData({ ...createFormData, tax: e.target.value })}
                  className="input-field pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="create-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="create-notes"
              value={createFormData.notes}
              onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
              rows={3}
              className="input-field resize-none"
              placeholder="Order notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              Create Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        reportType="orders"
        filters={filters}
      />
    </div>
  )
}
