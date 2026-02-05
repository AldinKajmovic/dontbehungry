'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Modal, Input, Button, Alert } from '@/components/ui'
import { adminService, AdminPlace, PaginationInfo, PlaceFilters, SortParams } from '@/services/admin'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'

export default function PlacesPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [places, setPlaces] = useState<AdminPlace[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<PlaceFilters>({})
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEmailReportModal, setShowEmailReportModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<AdminPlace | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadPlaces = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await adminService.getPlaces(
        pagination.page,
        pagination.limit,
        search || undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort.sortBy ? sort : undefined
      )
      setPlaces(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load places')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, filters, sort])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadPlaces()
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
        if (!next[k as keyof PlaceFilters]) delete next[k as keyof PlaceFilters]
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
    setFormData({ address: '', city: '', state: '', country: '', postalCode: '' })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (place: AdminPlace) => {
    setSelectedPlace(place)
    setFormData({
      address: place.address,
      city: place.city,
      state: place.state || '',
      country: place.country,
      postalCode: place.postalCode || '',
    })
    setFormError('')
    setShowEditModal(true)
  }

  const openDeleteModal = (place: AdminPlace) => {
    setSelectedPlace(place)
    setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormLoading(true)
      setFormError('')
      const newPlace = await adminService.createPlace({
        address: formData.address,
        city: formData.city,
        state: formData.state || undefined,
        country: formData.country,
        postalCode: formData.postalCode || undefined,
      })
      setPlaces((prev) => [newPlace, ...prev])
      setShowCreateModal(false)
      toast.success(t('toast.placeCreated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create place')
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlace) return
    try {
      setFormLoading(true)
      setFormError('')
      const updatedPlace = await adminService.updatePlace(selectedPlace.id, {
        address: formData.address,
        city: formData.city,
        state: formData.state || null,
        country: formData.country,
        postalCode: formData.postalCode || null,
      })
      setPlaces((prev) => prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p)))
      setShowEditModal(false)
      toast.success(t('toast.placeUpdated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update place')
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPlace) return
    try {
      setFormLoading(true)
      await adminService.deletePlace(selectedPlace.id)
      setPlaces((prev) => prev.filter((p) => p.id !== selectedPlace.id))
      setShowDeleteModal(false)
      toast.success(t('toast.placeDeleted'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete place')
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const columns = [
    {
      key: 'address',
      header: t('admin.placesPage.streetAddress'),
      sortable: true,
      render: (place: AdminPlace) => (
        <p className="font-medium text-gray-900">{place.address}</p>
      ),
    },
    {
      key: 'city',
      header: t('admin.placesPage.city'),
      sortable: true,
      render: (place: AdminPlace) => (
        <span className="text-gray-700">{place.city}</span>
      ),
    },
    {
      key: 'state',
      header: t('admin.placesPage.state'),
      sortable: true,
      render: (place: AdminPlace) => (
        <span className="text-gray-500">{place.state || '-'}</span>
      ),
    },
    {
      key: 'country',
      header: t('admin.placesPage.country'),
      sortable: true,
      render: (place: AdminPlace) => (
        <span className="text-gray-700">{place.country}</span>
      ),
    },
    {
      key: 'postalCode',
      header: t('admin.placesPage.postalCode'),
      sortable: true,
      render: (place: AdminPlace) => (
        <span className="text-gray-500">{place.postalCode || '-'}</span>
      ),
    },
    {
      key: 'id',
      header: 'ID',
      render: (place: AdminPlace) => (
        <span className="font-mono text-xs text-gray-400">{place.id.slice(0, 8)}...</span>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.placesPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.placesPage.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="places"
            filters={filters}
            onEmailClick={() => setShowEmailReportModal(true)}
          />
          <Button onClick={openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.placesPage.addPlace')}
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
              placeholder={t('admin.placesPage.searchPlaceholder')}
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
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.placesPage.city')}</label>
            <input
              type="text"
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              placeholder={t('admin.placesPage.filterByCity')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.placesPage.state')}</label>
            <input
              type="text"
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              placeholder={t('admin.placesPage.filterByState')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.placesPage.country')}</label>
            <input
              type="text"
              value={filters.country || ''}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              placeholder={t('admin.placesPage.filterByCountry')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.placesPage.postalCode')}</label>
            <input
              type="text"
              value={filters.postalCode || ''}
              onChange={(e) => handleFilterChange('postalCode', e.target.value)}
              placeholder={t('admin.placesPage.filterByPostalCode')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Table */}
      <DataTable
        columns={columns}
        data={places}
        keyField="id"
        isLoading={isLoading}
        emptyMessage={t('admin.placesPage.noPlacesFound')}
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(place) => (
          <>
            <button
              onClick={() => openEditModal(place)}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(place)}
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
        title={t('admin.placesPage.addNewPlace')}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('admin.placesPage.streetAddress')}
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main Street"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.placesPage.city')}
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <Input
              label={t('admin.placesPage.state')}
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              hint={`(${t('common.optional').toLowerCase()})`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.placesPage.country')}
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              required
            />
            <Input
              label={t('admin.placesPage.postalCode')}
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              hint={`(${t('common.optional').toLowerCase()})`}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.placesPage.createPlace')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('admin.placesPage.editPlace')}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('admin.placesPage.streetAddress')}
            id="edit-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.placesPage.city')}
              id="edit-city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <Input
              label={t('admin.placesPage.state')}
              id="edit-state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              hint={`(${t('common.optional').toLowerCase()})`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.placesPage.country')}
              id="edit-country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              required
            />
            <Input
              label={t('admin.placesPage.postalCode')}
              id="edit-postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              hint={`(${t('common.optional').toLowerCase()})`}
            />
          </div>

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
        title={t('admin.placesPage.deletePlace')}
        message={t('admin.placesPage.deletePlaceConfirm', { address: selectedPlace?.address || '' })}
        isLoading={formLoading}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        reportType="places"
        filters={filters}
      />
    </div>
  )
}
