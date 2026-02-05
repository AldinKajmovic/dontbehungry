'use client'

import { Modal, Button, Alert, SearchableSelect } from '@/components/ui'
import { StatusSelect, getOrderStatusOptions } from '@/components/admin/StatusSelect'
import { CreateOrderItemsManager } from './OrderItemsManager'
import { CreateFormData, CreateOrderItem, EditItemData, CreateNewItemData } from './hooks'

interface OrderCreateModalProps {
  t: (key: string) => string
  isOpen: boolean
  onClose: () => void
  formData: CreateFormData
  setFormData: (data: CreateFormData) => void
  formError: string
  formLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  // Order items
  createOrderItems: CreateOrderItem[]
  setCreateOrderItems: (items: CreateOrderItem[]) => void
  showCreateAddItemForm: boolean
  setShowCreateAddItemForm: (show: boolean) => void
  createEditingItemId: string | null
  setCreateEditingItemId: (id: string | null) => void
  createNewItemData: CreateNewItemData
  setCreateNewItemData: (data: CreateNewItemData) => void
  createEditItemData: EditItemData
  setCreateEditItemData: (data: EditItemData) => void
  createOrderSubtotal: number
  onAddItem: () => void
  onUpdateItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onStartEdit: (item: CreateOrderItem) => void
  // Option loaders
  loadCustomerOptions: (search: string) => Promise<{ value: string; label: string }[]>
  loadRestaurantOptions: (search: string) => Promise<{ value: string; label: string }[]>
  loadPlaceOptions: (search: string) => Promise<{ value: string; label: string }[]>
  loadDriverOptions: (search: string) => Promise<{ value: string; label: string }[]>
  loadCreateMenuItemOptions: (search: string) => Promise<{ value: string; label: string }[]>
}

export function OrderCreateModal({
  t,
  isOpen,
  onClose,
  formData,
  setFormData,
  formError,
  formLoading,
  onSubmit,
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
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onStartEdit,
  loadCustomerOptions,
  loadRestaurantOptions,
  loadPlaceOptions,
  loadDriverOptions,
  loadCreateMenuItemOptions,
}: OrderCreateModalProps) {
  const ORDER_STATUS_OPTIONS = getOrderStatusOptions(t)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.ordersPage.createOrder')}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {formError && <Alert type="error">{formError}</Alert>}

        <SearchableSelect
          label={t('admin.ordersPage.customer')}
          id="create-userId"
          value={formData.userId}
          onChange={(value) => setFormData({ ...formData, userId: value })}
          loadOptions={loadCustomerOptions}
          placeholder={t('admin.ordersPage.selectCustomer')}
          emptyMessage={t('admin.ordersPage.noCustomersFound')}
        />

        <SearchableSelect
          label={t('admin.ordersPage.restaurant')}
          id="create-restaurantId"
          value={formData.restaurantId}
          onChange={(value) => {
            setFormData({ ...formData, restaurantId: value })
            // Clear items when restaurant changes
            setCreateOrderItems([])
            setShowCreateAddItemForm(false)
          }}
          loadOptions={loadRestaurantOptions}
          placeholder={t('admin.ordersPage.selectRestaurant')}
          emptyMessage={t('admin.ordersPage.noRestaurantsFound')}
        />

        {/* Order Items Section - Only show when restaurant is selected */}
        {formData.restaurantId && (
          <CreateOrderItemsManager
            t={t}
            items={createOrderItems}
            showAddForm={showCreateAddItemForm}
            editingItemId={createEditingItemId}
            newItemData={createNewItemData}
            editItemData={createEditItemData}
            subtotal={createOrderSubtotal}
            onShowAddForm={setShowCreateAddItemForm}
            onNewItemDataChange={setCreateNewItemData}
            onEditItemDataChange={setCreateEditItemData}
            onAddItem={onAddItem}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onStartEdit={onStartEdit}
            onCancelEdit={() => setCreateEditingItemId(null)}
            loadMenuItemOptions={loadCreateMenuItemOptions}
            restaurantId={formData.restaurantId}
          />
        )}

        <SearchableSelect
          label={t('admin.ordersPage.deliveryAddress')}
          id="create-deliveryPlaceId"
          value={formData.deliveryPlaceId}
          onChange={(value) => setFormData({ ...formData, deliveryPlaceId: value })}
          loadOptions={loadPlaceOptions}
          placeholder={t('admin.ordersPage.selectDeliveryAddress')}
          emptyMessage={t('admin.ordersPage.noAddressesFound')}
        />

        <SearchableSelect
          label={t('admin.ordersPage.driver')}
          id="create-driverId"
          value={formData.driverId}
          onChange={(value) => setFormData({ ...formData, driverId: value })}
          loadOptions={loadDriverOptions}
          placeholder={t('admin.ordersPage.unassigned')}
          emptyMessage={t('admin.ordersPage.noDriversFound')}
          hint={t('admin.ordersPage.optionalUnassigned')}
        />

        <StatusSelect
          label={t('admin.ordersPage.status')}
          id="create-status"
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
          options={ORDER_STATUS_OPTIONS}
        />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="create-subtotal" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.ordersPage.subtotal')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="create-subtotal"
                step="0.01"
                min="0"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                className="input-field pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label htmlFor="create-deliveryFee" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.ordersPage.deliveryFee')} <span className="text-gray-400 font-normal">({t('common.optional').toLowerCase()})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="create-deliveryFee"
                step="0.01"
                min="0"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                className="input-field pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label htmlFor="create-tax" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.ordersPage.tax')} <span className="text-gray-400 font-normal">({t('common.optional').toLowerCase()})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="create-tax"
                step="0.01"
                min="0"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                className="input-field pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="create-notes" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.ordersPage.notes')} <span className="text-gray-400 font-normal">({t('common.optional').toLowerCase()})</span>
          </label>
          <textarea
            id="create-notes"
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
            {t('admin.ordersPage.createOrder')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
