'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { RangeFilter } from '@/components/admin/RangeFilter'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Modal, Input, Button, Alert, Select, SearchableSelect } from '@/components/ui'
import { adminService, AdminMenuItem, PaginationInfo, MenuItemFilters, SortParams } from '@/services/admin'
import { useLanguage } from '@/hooks/useLanguage'

export default function MenuItemsPage() {
  const { t } = useLanguage()

  const AVAILABILITY_OPTIONS = [
    { value: '', label: t('admin.menuItemsPage.allItems') },
    { value: 'true', label: t('admin.menuItemsPage.available') },
    { value: 'false', label: t('admin.menuItemsPage.unavailable') },
  ]
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<MenuItemFilters>({})
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEmailReportModal, setShowEmailReportModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AdminMenuItem | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    restaurantId: '',
    categoryId: '',
    isAvailable: true,
    preparationTime: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadMenuItems = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await adminService.getMenuItems(
        pagination.page,
        pagination.limit,
        search || undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort.sortBy ? sort : undefined
      )
      setMenuItems(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, filters, sort])

  useEffect(() => {
    loadMenuItems()
  }, [loadMenuItems])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined }
      Object.keys(next).forEach((k) => {
        if (!next[k as keyof MenuItemFilters]) delete next[k as keyof MenuItemFilters]
      })
      return next
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSort({ sortBy, sortOrder })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadMenuItems()
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit }))
  }

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      restaurantId: '',
      categoryId: '',
      isAvailable: true,
      preparationTime: '',
    })
    setFormError('')
    setShowCreateModal(true)
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
    setShowEditModal(true)
  }

  const openDeleteModal = (item: AdminMenuItem) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.restaurantId) {
      setFormError(t('admin.menuItemsPage.selectRestaurant'))
      return
    }
    try {
      setFormLoading(true)
      setFormError('')
      const newItem = await adminService.createMenuItem({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || undefined,
        restaurantId: formData.restaurantId,
        categoryId: formData.categoryId || undefined,
        isAvailable: formData.isAvailable,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
      })
      // Add new item to local state
      setMenuItems((prev) => [newItem, ...prev])
      setShowCreateModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create menu item')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    try {
      setFormLoading(true)
      setFormError('')
      const updatedItem = await adminService.updateMenuItem(selectedItem.id, {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || null,
        restaurantId: formData.restaurantId || undefined,
        categoryId: formData.categoryId || null,
        isAvailable: formData.isAvailable,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
      })
      // Update local state with response data
      setMenuItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
      setShowEditModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update menu item')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    try {
      setFormLoading(true)
      await adminService.deleteMenuItem(selectedItem.id)
      // Remove from local state
      setMenuItems((prev) => prev.filter((item) => item.id !== selectedItem.id))
      setShowDeleteModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu item')
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

  const columns = [
    {
      key: 'name',
      header: t('admin.menuItemsPage.item'),
      sortable: true,
      render: (item: AdminMenuItem) => (
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.restaurant.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: t('admin.menuItemsPage.price'),
      sortable: true,
      render: (item: AdminMenuItem) => (
        <span className="font-medium">${parseFloat(item.price).toFixed(2)}</span>
      ),
    },
    {
      key: 'category',
      header: t('admin.menuItemsPage.category'),
      render: (item: AdminMenuItem) => (
        <span className="text-gray-500">{item.category?.name || '-'}</span>
      ),
    },
    {
      key: 'isAvailable',
      header: t('admin.columns.status'),
      sortable: true,
      render: (item: AdminMenuItem) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.isAvailable ? t('admin.menuItemsPage.available') : t('admin.menuItemsPage.unavailable')}
        </span>
      ),
    },
    {
      key: 'preparationTime',
      header: t('admin.menuItemsPage.prepTime'),
      sortable: true,
      render: (item: AdminMenuItem) => (
        <span className="text-gray-500">{item.preparationTime ? `${item.preparationTime} min` : '-'}</span>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.menuItemsPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.menuItemsPage.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="menuItems"
            filters={filters}
            onEmailClick={() => setShowEmailReportModal(true)}
          />
          <Button onClick={openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.menuItemsPage.addItem')}
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
              placeholder={t('admin.menuItemsPage.searchPlaceholder')}
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            {t('common.search')}
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <SearchableSelect
              label={t('admin.menuItemsPage.category')}
              id="filter-category"
              value={filters.categoryId || ''}
              onChange={(value) => handleFilterChange('categoryId', value)}
              loadOptions={loadCategoryOptions}
              placeholder={t('admin.menuItemsPage.allCategories')}
              emptyMessage={t('admin.menuItemsPage.noCategoriesFound')}
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.menuItemsPage.availability')}</label>
            <select
              value={filters.isAvailable || ''}
              onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <RangeFilter
            label={t('admin.menuItemsPage.price')}
            minValue={filters.minPrice || ''}
            maxValue={filters.maxPrice || ''}
            onMinChange={(value) => handleFilterChange('minPrice', value)}
            onMaxChange={(value) => handleFilterChange('maxPrice', value)}
            min={0}
            max={500}
            step={0.5}
            prefix="$"
          />
          <RangeFilter
            label={t('admin.menuItemsPage.preparationTime')}
            minValue={filters.minPrepTime || ''}
            maxValue={filters.maxPrepTime || ''}
            onMinChange={(value) => handleFilterChange('minPrepTime', value)}
            onMaxChange={(value) => handleFilterChange('maxPrepTime', value)}
            min={0}
            max={120}
            step={5}
          />
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('admin.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Table */}
      <DataTable
        columns={columns}
        data={menuItems}
        keyField="id"
        isLoading={isLoading}
        emptyMessage={t('admin.menuItemsPage.noMenuItemsFound')}
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(item) => (
          <>
            <button
              onClick={() => openEditModal(item)}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title={t('common.edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(item)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title={t('common.delete')}
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
        title={t('admin.menuItemsPage.addNewMenuItem')}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('admin.menuItemsPage.itemName')}
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t('admin.menuItemsPage.description')}
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint={`(${t('common.optional')})`}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.menuItemsPage.price')}
              type="number"
              step="0.01"
              min="0"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              prefix="$"
              required
            />
            <Input
              label={t('admin.menuItemsPage.preparationTime')}
              type="number"
              min="0"
              id="preparationTime"
              value={formData.preparationTime}
              onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
              hint={`(${t('common.optional')})`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label={t('admin.menuItemsPage.restaurant')}
              id="restaurantId"
              value={formData.restaurantId}
              onChange={(value) => setFormData({ ...formData, restaurantId: value })}
              loadOptions={loadRestaurantOptions}
              placeholder={t('admin.menuItemsPage.searchRestaurants')}
              emptyMessage={t('admin.menuItemsPage.noRestaurantsFound')}
              required
            />
            <SearchableSelect
              label={t('admin.menuItemsPage.category')}
              id="categoryId"
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value })}
              loadOptions={loadCategoryOptions}
              placeholder={t('admin.menuItemsPage.searchCategories')}
              emptyMessage={t('admin.menuItemsPage.noCategoriesFound')}
              hint={`(${t('common.optional')})`}
            />
          </div>

          <Input
            label={t('admin.menuItemsPage.imageUrl')}
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
            hint={`(${t('common.optional')})`}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">{t('admin.menuItemsPage.available')}</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.menuItemsPage.createItem')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('admin.menuItemsPage.editMenuItem')}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('admin.menuItemsPage.itemName')}
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t('admin.menuItemsPage.description')}
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint={`(${t('common.optional')})`}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.menuItemsPage.price')}
              type="number"
              step="0.01"
              min="0"
              id="edit-price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              prefix="$"
              required
            />
            <Input
              label={t('admin.menuItemsPage.preparationTime')}
              type="number"
              min="0"
              id="edit-preparationTime"
              value={formData.preparationTime}
              onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
              hint={`(${t('common.optional')})`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label={t('admin.menuItemsPage.restaurant')}
              id="edit-restaurantId"
              value={formData.restaurantId}
              onChange={(value) => setFormData({ ...formData, restaurantId: value })}
              loadOptions={loadRestaurantOptions}
              placeholder={t('admin.menuItemsPage.searchRestaurants')}
              emptyMessage={t('admin.menuItemsPage.noRestaurantsFound')}
              initialLabel={selectedItem?.restaurant.name}
              required
            />
            <SearchableSelect
              label={t('admin.menuItemsPage.category')}
              id="edit-categoryId"
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value })}
              loadOptions={loadCategoryOptions}
              placeholder={t('admin.menuItemsPage.searchCategories')}
              emptyMessage={t('admin.menuItemsPage.noCategoriesFound')}
              initialLabel={selectedItem?.category?.name}
              hint={`(${t('common.optional')})`}
            />
          </div>

          <Input
            label={t('admin.menuItemsPage.imageUrl')}
            type="url"
            id="edit-imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
            hint={`(${t('common.optional')})`}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">{t('admin.menuItemsPage.available')}</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.buttons.saveChanges')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('admin.menuItemsPage.deleteMenuItem')}
        message={t('admin.menuItemsPage.deleteMenuItemConfirm', { name: selectedItem?.name || '' })}
        isLoading={formLoading}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        reportType="menuItems"
        filters={filters}
      />
    </div>
  )
}
