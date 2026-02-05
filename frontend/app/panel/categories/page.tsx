'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Modal, Input, Button, Alert } from '@/components/ui'
import { adminService, AdminCategory, PaginationInfo, SortParams } from '@/services/admin'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'

export default function CategoriesPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEmailReportModal, setShowEmailReportModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await adminService.getCategories(
        pagination.page,
        pagination.limit,
        search || undefined,
        sort.sortBy ? sort : undefined
      )
      setCategories(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, sort])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadCategories()
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

  const openCreateModal = () => {
    setFormData({ name: '', description: '', iconUrl: '' })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (category: AdminCategory) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      iconUrl: category.iconUrl || '',
    })
    setFormError('')
    setShowEditModal(true)
  }

  const openDeleteModal = (category: AdminCategory) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormLoading(true)
      setFormError('')
      const newCategory = await adminService.createCategory({
        name: formData.name,
        description: formData.description || undefined,
        iconUrl: formData.iconUrl || undefined,
      })
      setCategories((prev) => [newCategory, ...prev])
      setShowCreateModal(false)
      toast.success(t('toast.categoryCreated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create category')
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return
    try {
      setFormLoading(true)
      setFormError('')
      const updatedCategory = await adminService.updateCategory(selectedCategory.id, {
        name: formData.name,
        description: formData.description || null,
        iconUrl: formData.iconUrl || null,
      })
      setCategories((prev) => prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)))
      setShowEditModal(false)
      toast.success(t('toast.categoryUpdated'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update category')
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    try {
      setFormLoading(true)
      await adminService.deleteCategory(selectedCategory.id)
      setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id))
      setShowDeleteModal(false)
      toast.success(t('toast.categoryDeleted'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
      toast.error(t('toast.error'))
    } finally {
      setFormLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: t('admin.categoriesPage.categoryName'),
      sortable: true,
      render: (category: AdminCategory) => (
        <div className="flex items-center gap-3">
          {category.iconUrl ? (
            <img src={category.iconUrl} alt={category.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          )}
          <span className="font-medium text-gray-900">{category.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('admin.categoriesPage.description'),
      sortable: true,
      render: (category: AdminCategory) => (
        <span className="text-gray-500 truncate max-w-xs block">
          {category.description || '-'}
        </span>
      ),
    },
    {
      key: 'iconUrl',
      header: t('admin.categoriesPage.iconUrl'),
      render: (category: AdminCategory) => (
        <span className="text-gray-500 truncate max-w-xs block text-sm">
          {category.iconUrl || '-'}
        </span>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.categoriesPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.categoriesPage.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="categories"
            filters={{}}
            onEmailClick={() => setShowEmailReportModal(true)}
          />
          <Button onClick={openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.categoriesPage.addCategory')}
            </span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.categoriesPage.searchPlaceholder')}
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            {t('common.search')}
          </Button>
        </div>
      </form>

      {/* Error */}
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Table */}
      <DataTable
        columns={columns}
        data={categories}
        keyField="id"
        isLoading={isLoading}
        emptyMessage={t('admin.categoriesPage.noCategoriesFound')}
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(category) => (
          <>
            <button
              onClick={() => openEditModal(category)}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title={t('common.edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(category)}
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
        title={t('admin.categoriesPage.addNewCategory')}
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('admin.categoriesPage.categoryName')}
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t('admin.categoriesPage.description')}
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint={`(${t('common.optional')})`}
          />

          <Input
            label={t('admin.categoriesPage.iconUrl')}
            type="url"
            id="iconUrl"
            value={formData.iconUrl}
            onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
            placeholder="https://..."
            hint={`(${t('common.optional')})`}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.categoriesPage.createCategory')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('admin.categoriesPage.editCategory')}
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('admin.categoriesPage.categoryName')}
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t('admin.categoriesPage.description')}
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint={`(${t('common.optional')})`}
          />

          <Input
            label={t('admin.categoriesPage.iconUrl')}
            type="url"
            id="edit-iconUrl"
            value={formData.iconUrl}
            onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
            placeholder="https://..."
            hint={`(${t('common.optional')})`}
          />

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
        title={t('admin.categoriesPage.deleteCategory')}
        message={t('admin.categoriesPage.deleteCategoryConfirm', { name: selectedCategory?.name || '' })}
        isLoading={formLoading}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        reportType="categories"
        filters={{}}
      />
    </div>
  )
}
