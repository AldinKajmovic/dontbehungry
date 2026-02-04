'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { FilterBar } from '@/components/admin/FilterBar'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Modal, Input, Button, Alert, Select, SearchableSelect } from '@/components/ui'
import { adminService, AdminReview, PaginationInfo, ReviewFilters, SortParams } from '@/services/admin'
import { useLanguage } from '@/hooks/useLanguage'

export default function ReviewsPage() {
  const { t } = useLanguage()

  const RATING_OPTIONS = [
    { value: '1', label: `1 ${t('admin.reviewsPage.star')}` },
    { value: '2', label: `2 ${t('admin.reviewsPage.stars')}` },
    { value: '3', label: `3 ${t('admin.reviewsPage.stars')}` },
    { value: '4', label: `4 ${t('admin.reviewsPage.stars')}` },
    { value: '5', label: `5 ${t('admin.reviewsPage.stars')}` },
  ]

  const FILTER_CONFIG = [
    {
      key: 'rating',
      label: t('admin.reviewsPage.rating'),
      options: RATING_OPTIONS,
      placeholder: t('admin.reviewsPage.allRatings'),
    },
  ]
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ReviewFilters>({})
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEmailReportModal, setShowEmailReportModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    userId: '',
    restaurantId: '',
    rating: '5',
    title: '',
    content: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await adminService.getReviews(
        pagination.page,
        pagination.limit,
        search || undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort.sortBy ? sort : undefined
      )
      setReviews(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, filters, sort])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined }
      Object.keys(next).forEach((k) => {
        if (!next[k as keyof ReviewFilters]) delete next[k as keyof ReviewFilters]
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadReviews()
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit }))
  }

  const openCreateModal = () => {
    setFormData({ userId: '', restaurantId: '', rating: '5', title: '', content: '' })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (review: AdminReview) => {
    setSelectedReview(review)
    setFormData({
      userId: review.user.id,
      restaurantId: review.restaurant.id,
      rating: String(review.rating),
      title: review.title || '',
      content: review.content || '',
    })
    setFormError('')
    setShowEditModal(true)
  }

  const openDeleteModal = (review: AdminReview) => {
    setSelectedReview(review)
    setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || !formData.restaurantId) {
      setFormError(t('admin.reviewsPage.selectUserAndRestaurant'))
      return
    }
    try {
      setFormLoading(true)
      setFormError('')
      const newReview = await adminService.createReview({
        userId: formData.userId,
        restaurantId: formData.restaurantId,
        rating: parseInt(formData.rating),
        title: formData.title || undefined,
        content: formData.content || undefined,
      })
      setReviews((prev) => [newReview, ...prev])
      setShowCreateModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create review')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReview) return
    try {
      setFormLoading(true)
      setFormError('')
      const updatedReview = await adminService.updateReview(selectedReview.id, {
        rating: parseInt(formData.rating),
        title: formData.title || null,
        content: formData.content || null,
      })
      setReviews((prev) => prev.map((r) => (r.id === updatedReview.id ? updatedReview : r)))
      setShowEditModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update review')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedReview) return
    try {
      setFormLoading(true)
      await adminService.deleteReview(selectedReview.id)
      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id))
      setShowDeleteModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review')
    } finally {
      setFormLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  const columns = [
    {
      key: 'restaurant',
      header: t('admin.reviewsPage.restaurant'),
      render: (review: AdminReview) => (
        <p className="font-medium text-gray-900">{review.restaurant.name}</p>
      ),
    },
    {
      key: 'user',
      header: t('admin.reviewsPage.reviewer'),
      render: (review: AdminReview) => (
        <div>
          <p className="text-sm">{review.user.firstName} {review.user.lastName}</p>
          <p className="text-xs text-gray-500">{review.user.email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: t('admin.reviewsPage.rating'),
      sortable: true,
      render: (review: AdminReview) => renderStars(review.rating),
    },
    {
      key: 'title',
      header: t('admin.reviewsPage.title'),
      sortable: true,
      render: (review: AdminReview) => (
        <span className="text-gray-700">{review.title || '-'}</span>
      ),
    },
    {
      key: 'content',
      header: t('admin.reviewsPage.content'),
      render: (review: AdminReview) => (
        <span className="text-gray-500 truncate max-w-xs block text-sm">
          {review.content || '-'}
        </span>
      ),
    },
  ]

  // Dropdown loaders for SearchableSelect
  const loadUserOptions = useCallback((searchTerm: string) => {
    return adminService.getUsersForSelect(searchTerm || undefined)
  }, [])

  const loadRestaurantOptions = useCallback((searchTerm: string) => {
    return adminService.getRestaurantsForSelect(searchTerm || undefined)
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.reviewsPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.reviewsPage.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="reviews"
            filters={filters}
            onEmailClick={() => setShowEmailReportModal(true)}
          />
          <Button onClick={openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.reviewsPage.addReview')}
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
              placeholder={t('admin.reviewsPage.searchPlaceholder')}
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            {t('common.search')}
          </Button>
        </div>
      </form>

      {/* Filters */}
      <FilterBar
        filters={FILTER_CONFIG}
        values={filters as Record<string, string>}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Error */}
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Table */}
      <DataTable
        columns={columns}
        data={reviews}
        keyField="id"
        isLoading={isLoading}
        emptyMessage={t('admin.reviewsPage.noReviewsFound')}
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(review) => (
          <>
            <button
              onClick={() => openEditModal(review)}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(review)}
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
        title={t('admin.reviewsPage.addNewReview')}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label={t('admin.reviewsPage.user')}
              id="userId"
              value={formData.userId}
              onChange={(value) => setFormData({ ...formData, userId: value })}
              loadOptions={loadUserOptions}
              placeholder={t('admin.reviewsPage.searchUsers')}
              emptyMessage={t('admin.reviewsPage.noUsersFound')}
              required
            />
            <SearchableSelect
              label={t('admin.reviewsPage.restaurant')}
              id="restaurantId"
              value={formData.restaurantId}
              onChange={(value) => setFormData({ ...formData, restaurantId: value })}
              loadOptions={loadRestaurantOptions}
              placeholder={t('admin.reviewsPage.searchRestaurants')}
              emptyMessage={t('admin.reviewsPage.noRestaurantsFound')}
              required
            />
          </div>

          <Select
            label={t('admin.reviewsPage.rating')}
            id="rating"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            options={RATING_OPTIONS}
          />

          <Input
            label={t('admin.reviewsPage.title')}
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            hint={`(${t('common.optional').toLowerCase()})`}
          />

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.reviewsPage.content')} <span className="text-gray-400 font-normal">({t('common.optional').toLowerCase()})</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="input-field resize-none"
              placeholder={t('admin.reviewsPage.reviewContent')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.reviewsPage.createReview')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('admin.reviewsPage.editReview')}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          {/* Review Info */}
          {selectedReview && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('admin.reviewsPage.restaurant')}:</span>
                  <p>{selectedReview.restaurant.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('admin.reviewsPage.reviewer')}:</span>
                  <p>{selectedReview.user.firstName} {selectedReview.user.lastName}</p>
                </div>
              </div>
            </div>
          )}

          <Select
            label={t('admin.reviewsPage.rating')}
            id="edit-rating"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            options={RATING_OPTIONS}
          />

          <Input
            label={t('admin.reviewsPage.title')}
            id="edit-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            hint={`(${t('common.optional').toLowerCase()})`}
          />

          <div>
            <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.reviewsPage.content')} <span className="text-gray-400 font-normal">({t('common.optional').toLowerCase()})</span>
            </label>
            <textarea
              id="edit-content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="input-field resize-none"
              placeholder={t('admin.reviewsPage.reviewContent')}
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
        title={t('admin.reviewsPage.deleteReview')}
        message={t('admin.reviewsPage.deleteReviewConfirm', { name: `${selectedReview?.user.firstName} ${selectedReview?.user.lastName}` })}
        isLoading={formLoading}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        reportType="reviews"
        filters={filters}
      />
    </div>
  )
}
