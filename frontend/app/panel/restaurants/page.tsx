'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { RangeFilter } from '@/components/admin/RangeFilter'
import { Modal, Input, Button, Alert, SearchableSelect } from '@/components/ui'
import { adminService, AdminRestaurant, PaginationInfo, RestaurantFilters, SortParams } from '@/services/admin'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<RestaurantFilters>({})
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    ownerId: '',
    placeId: '',
    minOrderAmount: '',
    deliveryFee: '',
    images: [] as string[],
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadRestaurants = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await adminService.getRestaurants(
        pagination.page,
        pagination.limit,
        search || undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort.sortBy ? sort : undefined
      )
      setRestaurants(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, filters, sort])

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadRestaurants()
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit }))
  }

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSort({ sortBy, sortOrder })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined }
      Object.keys(next).forEach((k) => {
        if (!next[k as keyof RestaurantFilters]) delete next[k as keyof RestaurantFilters]
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

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      phone: '',
      email: '',
      ownerId: '',
      placeId: '',
      minOrderAmount: '',
      deliveryFee: '',
      images: [],
    })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (restaurant: AdminRestaurant) => {
    setSelectedRestaurant(restaurant)
    // Build images array from logo and cover
    const images: string[] = []
    if (restaurant.logoUrl) images.push(restaurant.logoUrl)
    if (restaurant.coverUrl) images.push(restaurant.coverUrl)

    setFormData({
      name: restaurant.name,
      description: restaurant.description || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      ownerId: restaurant.owner.id,
      placeId: restaurant.place.id,
      minOrderAmount: restaurant.minOrderAmount || '',
      deliveryFee: restaurant.deliveryFee || '',
      images,
    })
    setFormError('')
    setShowEditModal(true)
  }

  const openDeleteModal = (restaurant: AdminRestaurant) => {
    setSelectedRestaurant(restaurant)
    setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ownerId || !formData.placeId) {
      setFormError('Please select both an owner and a place')
      return
    }
    try {
      setFormLoading(true)
      setFormError('')
      const newRestaurant = await adminService.createRestaurant({
        name: formData.name,
        description: formData.description || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        ownerId: formData.ownerId,
        placeId: formData.placeId,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : undefined,
        logoUrl: formData.images[0] || null,
        coverUrl: formData.images[1] || null,
      })
      setRestaurants((prev) => [newRestaurant, ...prev])
      setShowCreateModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create restaurant')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRestaurant) return
    if (!formData.ownerId || !formData.placeId) {
      setFormError('Please select both an owner and a place')
      return
    }
    try {
      setFormLoading(true)
      setFormError('')
      const updatedRestaurant = await adminService.updateRestaurant(selectedRestaurant.id, {
        name: formData.name,
        description: formData.description || null,
        phone: formData.phone || null,
        email: formData.email || null,
        ownerId: formData.ownerId,
        placeId: formData.placeId,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : null,
        logoUrl: formData.images[0] || null,
        coverUrl: formData.images[1] || null,
      })
      setRestaurants((prev) => prev.map((r) => (r.id === updatedRestaurant.id ? updatedRestaurant : r)))
      setShowEditModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update restaurant')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRestaurant) return
    try {
      setFormLoading(true)
      await adminService.deleteRestaurant(selectedRestaurant.id)
      setRestaurants((prev) => prev.filter((r) => r.id !== selectedRestaurant.id))
      setShowDeleteModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete restaurant')
    } finally {
      setFormLoading(false)
    }
  }

  // Dropdown loaders for SearchableSelect
  const loadOwnerOptions = useCallback((searchTerm: string) => {
    return adminService.getUsersForSelect(searchTerm || undefined)
  }, [])

  const loadPlaceOptions = useCallback((searchTerm: string) => {
    return adminService.getPlacesForSelect(searchTerm || undefined)
  }, [])

  const columns = [
    {
      key: 'name',
      header: 'Restaurant',
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <div>
          <p className="font-medium text-gray-900">{restaurant.name}</p>
          <p className="text-xs text-gray-500">{restaurant.place.city}, {restaurant.place.country}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (restaurant: AdminRestaurant) => (
        <div>
          <p className="text-sm">{restaurant.owner.firstName} {restaurant.owner.lastName}</p>
          <p className="text-xs text-gray-500">{restaurant.owner.email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm">{parseFloat(restaurant.rating).toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'minOrderAmount',
      header: 'Min Order',
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <span className="text-sm">${restaurant.minOrderAmount || '0'}</span>
      ),
    },
    {
      key: 'deliveryFee',
      header: 'Delivery Fee',
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <span className="text-sm">${restaurant.deliveryFee || '0'}</span>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-500 mt-1">Manage restaurant listings</p>
        </div>
        <Button onClick={openCreateModal} className="!w-auto !px-4">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Restaurant
          </span>
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
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
              label="Owner"
              id="filter-owner"
              value={filters.ownerId || ''}
              onChange={(value) => handleFilterChange('ownerId', value)}
              loadOptions={loadOwnerOptions}
              placeholder="All Owners"
              emptyMessage="No users found"
            />
          </div>
          <RangeFilter
            label="Rating"
            minValue={filters.minRating || ''}
            maxValue={filters.maxRating || ''}
            onMinChange={(value) => handleFilterChange('minRating', value)}
            onMaxChange={(value) => handleFilterChange('maxRating', value)}
            min={0}
            max={5}
            step={0.1}
          />
          <RangeFilter
            label="Delivery Fee"
            minValue={filters.minDeliveryFee || ''}
            maxValue={filters.maxDeliveryFee || ''}
            onMinChange={(value) => handleFilterChange('minDeliveryFee', value)}
            onMaxChange={(value) => handleFilterChange('maxDeliveryFee', value)}
            min={0}
            max={100}
            step={0.5}
            prefix="$"
          />
          <RangeFilter
            label="Min Order Amount"
            minValue={filters.minOrderAmount || ''}
            maxValue={filters.maxOrderAmount || ''}
            onMinChange={(value) => handleFilterChange('minOrderAmount', value)}
            onMaxChange={(value) => handleFilterChange('maxOrderAmount', value)}
            min={0}
            max={500}
            step={1}
            prefix="$"
          />
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
        data={restaurants}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No restaurants found"
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(restaurant) => (
          <>
            <button
              onClick={() => openEditModal(restaurant)}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(restaurant)}
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

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Restaurant"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label="Restaurant Name"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint="(optional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              hint="(optional)"
            />
            <Input
              label="Email"
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              hint="(optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label="Owner"
              id="ownerId"
              value={formData.ownerId}
              onChange={(value) => setFormData({ ...formData, ownerId: value })}
              loadOptions={loadOwnerOptions}
              placeholder="Search users..."
              emptyMessage="No users found"
              required
            />
            <SearchableSelect
              label="Place"
              id="placeId"
              value={formData.placeId}
              onChange={(value) => setFormData({ ...formData, placeId: value })}
              loadOptions={loadPlaceOptions}
              placeholder="Search places..."
              emptyMessage="No places found"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <Input
              label="Min Order"
              type="number"
              step="0.01"
              id="minOrderAmount"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              prefix="$"
              hint="(optional)"
            />
            <Input
              label="Delivery Fee"
              type="number"
              step="0.01"
              id="deliveryFee"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
              prefix="$"
              hint="(optional)"
            />
          </div>

          {/* Gallery Section */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Gallery (Interior, Exterior, etc.)</p>
            <div className="grid grid-cols-3 gap-3">
              {formData.images.map((imgUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imgUrl}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({
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
              {formData.images.length < 6 && (
                <button
                  type="button"
                  className="group flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => {
                    // Visual only for now - file upload to be implemented
                  }}
                >
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 group-hover:text-primary-600 mt-1">{formData.images.length} / 6</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click to add images (up to 6)</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              Create Restaurant
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Restaurant"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label="Restaurant Name"
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint="(optional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              hint="(optional)"
            />
            <Input
              label="Email"
              type="email"
              id="edit-email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              hint="(optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label="Owner"
              id="edit-ownerId"
              value={formData.ownerId}
              onChange={(value) => setFormData({ ...formData, ownerId: value })}
              loadOptions={loadOwnerOptions}
              placeholder="Search users..."
              emptyMessage="No users found"
              initialLabel={selectedRestaurant ? `${selectedRestaurant.owner.firstName} ${selectedRestaurant.owner.lastName}` : undefined}
              required
            />
            <SearchableSelect
              label="Place"
              id="edit-placeId"
              value={formData.placeId}
              onChange={(value) => setFormData({ ...formData, placeId: value })}
              loadOptions={loadPlaceOptions}
              placeholder="Search places..."
              emptyMessage="No places found"
              initialLabel={selectedRestaurant ? `${selectedRestaurant.place.address}, ${selectedRestaurant.place.city}` : undefined}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <Input
              label="Min Order"
              type="number"
              step="0.01"
              id="edit-minOrderAmount"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              prefix="$"
              hint="(optional)"
            />
            <Input
              label="Delivery Fee"
              type="number"
              step="0.01"
              id="edit-deliveryFee"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
              prefix="$"
              hint="(optional)"
            />
          </div>

          {/* Gallery Section */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Gallery (Interior, Exterior, etc.)</p>
            <div className="grid grid-cols-3 gap-3">
              {formData.images.map((imgUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imgUrl}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({
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
              {formData.images.length < 6 && (
                <button
                  type="button"
                  className="group flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => {
                    // Visual only for now - file upload to be implemented
                  }}
                >
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 group-hover:text-primary-600 mt-1">{formData.images.length} / 6</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click to add images (up to 6)</p>
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
        title="Delete Restaurant"
        message={`Are you sure you want to delete "${selectedRestaurant?.name}"? This will also delete all associated menu items, orders, and reviews.`}
        isLoading={formLoading}
      />
    </div>
  )
}
