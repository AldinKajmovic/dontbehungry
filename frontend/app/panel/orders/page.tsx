'use client'

import { useEffect } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Button, Alert } from '@/components/ui'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'
import {
  useOrdersCRUD,
  OrdersTable,
  OrderFiltersSection,
  OrderEditModal,
  OrderCreateModal,
} from '@/components/admin/orders'

export default function OrdersPage() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const crud = useOrdersCRUD()

  useEffect(() => {
    crud.loadOrders()
  }, [crud.loadOrders])

  // Enhanced handlers with toast notifications
  const handleCreate = async (e: React.FormEvent) => {
    try {
      await crud.handleCreate(e)
      toast.success(t('toast.orderCreated'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    try {
      await crud.handleUpdate(e)
      toast.success(t('toast.orderStatusUpdated'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const handleDelete = async () => {
    try {
      await crud.handleDelete()
      toast.success(t('toast.orderDeleted'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const handleAddItem = async () => {
    try {
      await crud.handleAddItem()
      toast.success(t('toast.menuItemSaved'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const handleUpdateItem = async (itemId: string) => {
    try {
      await crud.handleUpdateItem(itemId)
      toast.success(t('toast.menuItemSaved'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await crud.handleDeleteItem(itemId)
      toast.success(t('toast.menuItemDeleted'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.orders')}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t('admin.manageCustomerOrders')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="orders"
            filters={crud.filters}
            onEmailClick={() => crud.setShowEmailReportModal(true)}
          />
          <Button onClick={crud.openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.createOrder')}
            </span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={crud.handleSearch} className="mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={crud.search}
              onChange={(e) => crud.setSearch(e.target.value)}
              placeholder={t('admin.searchByOrderOrEmail')}
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            {t('common.search')}
          </Button>
        </div>
      </form>

      {/* Filters */}
      <OrderFiltersSection
        t={t}
        filters={crud.filters}
        hasActiveFilters={crud.hasActiveFilters}
        onFilterChange={crud.handleFilterChange}
        onClearFilters={crud.handleClearFilters}
        loadCustomerOptions={crud.loadCustomerOptions}
        loadDriverOptions={crud.loadDriverOptions}
      />

      {/* Error */}
      {crud.error && <Alert type="error" className="mb-6">{crud.error}</Alert>}

      {/* Table */}
      <OrdersTable
        t={t}
        orders={crud.orders}
        isLoading={crud.isLoading}
        sort={crud.sort}
        onSort={crud.handleSort}
        onEdit={crud.openEditModal}
        onDelete={crud.openDeleteModal}
      />

      {/* Pagination */}
      {crud.pagination.totalPages > 0 && (
        <Pagination
          page={crud.pagination.page}
          totalPages={crud.pagination.totalPages}
          limit={crud.pagination.limit}
          total={crud.pagination.total}
          onPageChange={crud.handlePageChange}
          onLimitChange={crud.handleLimitChange}
        />
      )}

      {/* Edit Modal */}
      <OrderEditModal
        t={t}
        isOpen={crud.showEditModal}
        onClose={() => crud.setShowEditModal(false)}
        selectedOrder={crud.selectedOrder}
        formData={crud.formData}
        setFormData={crud.setFormData}
        formError={crud.formError}
        formLoading={crud.formLoading}
        onSubmit={handleUpdate}
        orderItems={crud.orderItems}
        orderItemsLoading={crud.orderItemsLoading}
        showAddItemForm={crud.showAddItemForm}
        setShowAddItemForm={crud.setShowAddItemForm}
        editingItemId={crud.editingItemId}
        setEditingItemId={crud.setEditingItemId}
        newItemData={crud.newItemData}
        setNewItemData={crud.setNewItemData}
        editItemData={crud.editItemData}
        setEditItemData={crud.setEditItemData}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onStartEdit={crud.startEditItem}
        loadDriverOptions={crud.loadDriverOptions}
        loadMenuItemOptions={crud.loadMenuItemOptions}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={crud.showDeleteModal}
        onClose={() => crud.setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('admin.ordersPage.deleteOrder')}
        message={t('admin.ordersPage.deleteOrderConfirm', { id: crud.selectedOrder?.id.slice(0, 8) + '...' })}
        isLoading={crud.formLoading}
      />

      {/* Create Modal */}
      <OrderCreateModal
        t={t}
        isOpen={crud.showCreateModal}
        onClose={() => crud.setShowCreateModal(false)}
        formData={crud.createFormData}
        setFormData={crud.setCreateFormData}
        formError={crud.formError}
        formLoading={crud.formLoading}
        onSubmit={handleCreate}
        createOrderItems={crud.createOrderItems}
        setCreateOrderItems={crud.setCreateOrderItems}
        showCreateAddItemForm={crud.showCreateAddItemForm}
        setShowCreateAddItemForm={crud.setShowCreateAddItemForm}
        createEditingItemId={crud.createEditingItemId}
        setCreateEditingItemId={crud.setCreateEditingItemId}
        createNewItemData={crud.createNewItemData}
        setCreateNewItemData={crud.setCreateNewItemData}
        createEditItemData={crud.createEditItemData}
        setCreateEditItemData={crud.setCreateEditItemData}
        createOrderSubtotal={crud.createOrderSubtotal}
        onAddItem={crud.handleCreateAddItem}
        onUpdateItem={crud.handleCreateUpdateItem}
        onDeleteItem={crud.handleCreateDeleteItem}
        onStartEdit={crud.startCreateEditItem}
        loadCustomerOptions={crud.loadCustomerOptions}
        loadRestaurantOptions={crud.loadRestaurantOptions}
        loadPlaceOptions={crud.loadPlaceOptions}
        loadDriverOptions={crud.loadDriverOptions}
        loadCreateMenuItemOptions={crud.loadCreateMenuItemOptions}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={crud.showEmailReportModal}
        onClose={() => crud.setShowEmailReportModal(false)}
        reportType="orders"
        filters={crud.filters}
      />
    </div>
  )
}
