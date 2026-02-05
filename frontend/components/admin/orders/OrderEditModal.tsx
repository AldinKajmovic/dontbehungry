'use client'

import { Modal, Button, Alert, SearchableSelect } from '@/components/ui'
import { StatusSelect, ORDER_STATUS_COLORS, getOrderStatusOptions } from '@/components/admin/StatusSelect'
import { AdminOrder, AdminOrderItem } from '@/services/admin'
import { OrderItemsManager } from './OrderItemsManager'
import { OrderFormData, EditItemData, NewItemData } from './hooks'

interface OrderEditModalProps {
  t: (key: string) => string
  isOpen: boolean
  onClose: () => void
  selectedOrder: AdminOrder | null
  formData: OrderFormData
  setFormData: (data: OrderFormData) => void
  formError: string
  formLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  // Order items
  orderItems: AdminOrderItem[]
  orderItemsLoading: boolean
  showAddItemForm: boolean
  setShowAddItemForm: (show: boolean) => void
  editingItemId: string | null
  setEditingItemId: (id: string | null) => void
  newItemData: NewItemData
  setNewItemData: (data: NewItemData) => void
  editItemData: EditItemData
  setEditItemData: (data: EditItemData) => void
  onAddItem: () => void
  onUpdateItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onStartEdit: (item: AdminOrderItem) => void
  // Option loaders
  loadDriverOptions: (search: string) => Promise<{ value: string; label: string }[]>
  loadMenuItemOptions: (search: string) => Promise<{ value: string; label: string }[]>
}

export function OrderEditModal({
  t,
  isOpen,
  onClose,
  selectedOrder,
  formData,
  setFormData,
  formError,
  formLoading,
  onSubmit,
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
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onStartEdit,
  loadDriverOptions,
  loadMenuItemOptions,
}: OrderEditModalProps) {
  const ORDER_STATUS_OPTIONS = getOrderStatusOptions(t)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.ordersPage.editOrder')}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {formError && <Alert type="error">{formError}</Alert>}

        {/* Order Info */}
        {selectedOrder && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('admin.ordersPage.orderId')}:</span>
                <p className="font-mono">{selectedOrder.id}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('admin.ordersPage.customer')}:</span>
                <p>{selectedOrder.user.firstName} {selectedOrder.user.lastName}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('admin.ordersPage.restaurant')}:</span>
                <p>{selectedOrder.restaurant.name}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('admin.ordersPage.total')}:</span>
                <p className="font-medium">${parseFloat(selectedOrder.totalAmount).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Items Section */}
        {selectedOrder && (
          <OrderItemsManager
            t={t}
            items={orderItems}
            isLoading={orderItemsLoading}
            showAddForm={showAddItemForm}
            editingItemId={editingItemId}
            newItemData={newItemData}
            editItemData={editItemData}
            restaurantId={selectedOrder.restaurant.id}
            onShowAddForm={setShowAddItemForm}
            onNewItemDataChange={setNewItemData}
            onEditItemDataChange={setEditItemData}
            onAddItem={onAddItem}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onStartEdit={onStartEdit}
            onCancelEdit={() => setEditingItemId(null)}
            loadMenuItemOptions={loadMenuItemOptions}
            selectedOrder={selectedOrder}
          />
        )}

        <StatusSelect
          label={t('admin.ordersPage.status')}
          id="status"
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
          options={ORDER_STATUS_OPTIONS}
        />

        <SearchableSelect
          label={t('admin.ordersPage.driver')}
          id="driverId"
          value={formData.driverId}
          onChange={(value) => setFormData({ ...formData, driverId: value })}
          loadOptions={loadDriverOptions}
          placeholder={t('admin.ordersPage.unassigned')}
          emptyMessage={t('admin.ordersPage.noDriversFound')}
          initialLabel={selectedOrder?.driver && formData.driverId ? `${selectedOrder.driver.firstName} ${selectedOrder.driver.lastName}` : ''}
          hint={t('admin.ordersPage.optionalUnassigned')}
        />

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.ordersPage.notes')} <span className="text-gray-400 font-normal">({t('common.optional').toLowerCase()})</span>
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="input-field resize-none"
            placeholder={t('admin.ordersPage.orderNotes')}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1" isLoading={formLoading}>
            {t('admin.buttons.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
