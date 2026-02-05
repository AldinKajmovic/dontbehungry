'use client'

import { SearchableSelect } from '@/components/ui'
import { AdminOrderItem } from '@/services/admin'
import { CreateOrderItem, EditItemData, NewItemData, CreateNewItemData } from './hooks'

interface OrderItemsManagerProps {
  t: (key: string) => string
  items: AdminOrderItem[]
  isLoading: boolean
  showAddForm: boolean
  editingItemId: string | null
  newItemData: NewItemData
  editItemData: EditItemData
  restaurantId: string
  onShowAddForm: (show: boolean) => void
  onNewItemDataChange: (data: NewItemData) => void
  onEditItemDataChange: (data: EditItemData) => void
  onAddItem: () => void
  onUpdateItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onStartEdit: (item: AdminOrderItem) => void
  onCancelEdit: () => void
  loadMenuItemOptions: (search: string) => Promise<{ value: string; label: string }[]>
  selectedOrder?: {
    subtotal: string
    deliveryFee: string
    tax: string
    totalAmount: string
  } | null
}

export function OrderItemsManager({
  t,
  items,
  isLoading,
  showAddForm,
  editingItemId,
  newItemData,
  editItemData,
  restaurantId,
  onShowAddForm,
  onNewItemDataChange,
  onEditItemDataChange,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onStartEdit,
  onCancelEdit,
  loadMenuItemOptions,
  selectedOrder,
}: OrderItemsManagerProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{t('admin.ordersPage.orderItems')}</h3>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => onShowAddForm(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('admin.ordersPage.addItem')}
          </button>
        )}
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="space-y-3">
            <SearchableSelect
              key={`menu-item-select-${restaurantId}`}
              label={t('admin.ordersPage.menuItem')}
              id="new-item-menuItemId"
              value={newItemData.menuItemId}
              onChange={(value) => onNewItemDataChange({ ...newItemData, menuItemId: value })}
              loadOptions={loadMenuItemOptions}
              placeholder={t('admin.ordersPage.selectMenuItem')}
              emptyMessage={t('admin.ordersPage.noMenuItemsForRestaurant')}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ordersPage.quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={newItemData.quantity}
                  onChange={(e) => onNewItemDataChange({ ...newItemData, quantity: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ordersPage.notes')}</label>
                <input
                  type="text"
                  value={newItemData.notes}
                  onChange={(e) => onNewItemDataChange({ ...newItemData, notes: e.target.value })}
                  className="input-field"
                  placeholder={t('admin.ordersPage.optional')}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onAddItem}
                disabled={isLoading || !newItemData.menuItemId}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? t('admin.ordersPage.adding') : t('admin.buttons.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onShowAddForm(false)
                  onNewItemDataChange({ menuItemId: '', quantity: '1', notes: '' })
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {isLoading && items.length === 0 ? (
        <div className="text-center py-4 text-gray-500">{t('admin.ordersPage.loadingItems')}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-4 text-gray-400">{t('admin.ordersPage.noItemsInOrder')}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
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
                    onChange={(e) => onEditItemDataChange({ ...editItemData, quantity: e.target.value })}
                    className="w-16 px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                  <input
                    type="text"
                    value={editItemData.notes}
                    onChange={(e) => onEditItemDataChange({ ...editItemData, notes: e.target.value })}
                    className="w-32 px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder={t('admin.ordersPage.notes')}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateItem(item.id)}
                    disabled={isLoading}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
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
                      onClick={() => onStartEdit(item)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      disabled={isLoading}
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
      {items.length > 0 && selectedOrder && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('admin.ordersPage.subtotal')}:</span>
            <span>${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('admin.ordersPage.deliveryFee')}:</span>
            <span>${parseFloat(selectedOrder.deliveryFee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('admin.ordersPage.tax')}:</span>
            <span>${parseFloat(selectedOrder.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium mt-1 pt-1 border-t border-gray-100">
            <span>{t('admin.ordersPage.total')}:</span>
            <span>${parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface CreateOrderItemsManagerProps {
  t: (key: string) => string
  items: CreateOrderItem[]
  showAddForm: boolean
  editingItemId: string | null
  newItemData: CreateNewItemData
  editItemData: EditItemData
  subtotal: number
  onShowAddForm: (show: boolean) => void
  onNewItemDataChange: (data: CreateNewItemData) => void
  onEditItemDataChange: (data: EditItemData) => void
  onAddItem: () => void
  onUpdateItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onStartEdit: (item: CreateOrderItem) => void
  onCancelEdit: () => void
  loadMenuItemOptions: (search: string) => Promise<{ value: string; label: string }[]>
  restaurantId: string
}

export function CreateOrderItemsManager({
  t,
  items,
  showAddForm,
  editingItemId,
  newItemData,
  editItemData,
  subtotal,
  onShowAddForm,
  onNewItemDataChange,
  onEditItemDataChange,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onStartEdit,
  onCancelEdit,
  loadMenuItemOptions,
  restaurantId,
}: CreateOrderItemsManagerProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{t('admin.ordersPage.orderItems')}</h3>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => onShowAddForm(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('admin.ordersPage.addItem')}
          </button>
        )}
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="space-y-3">
            <SearchableSelect
              key={`create-menu-item-select-${restaurantId}`}
              label={t('admin.ordersPage.menuItem')}
              id="create-new-item-menuItemId"
              value={newItemData.menuItemId}
              onChange={(value, label) => onNewItemDataChange({ ...newItemData, menuItemId: value, menuItemLabel: label || '' })}
              loadOptions={loadMenuItemOptions}
              placeholder={t('admin.ordersPage.selectMenuItem')}
              emptyMessage={t('admin.ordersPage.noMenuItemsForRestaurant')}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ordersPage.quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={newItemData.quantity}
                  onChange={(e) => onNewItemDataChange({ ...newItemData, quantity: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ordersPage.notes')}</label>
                <input
                  type="text"
                  value={newItemData.notes}
                  onChange={(e) => onNewItemDataChange({ ...newItemData, notes: e.target.value })}
                  className="input-field"
                  placeholder={t('admin.ordersPage.optional')}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onAddItem}
                disabled={!newItemData.menuItemId}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {t('admin.buttons.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onShowAddForm(false)
                  onNewItemDataChange({ menuItemId: '', menuItemLabel: '', quantity: '1', notes: '' })
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-4 text-gray-400">{t('admin.ordersPage.noItemsAddedYet')}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3">
              {editingItemId === item.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.menuItemName}</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={editItemData.quantity}
                    onChange={(e) => onEditItemDataChange({ ...editItemData, quantity: e.target.value })}
                    className="w-16 px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                  <input
                    type="text"
                    value={editItemData.notes}
                    onChange={(e) => onEditItemDataChange({ ...editItemData, notes: e.target.value })}
                    className="w-32 px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder={t('admin.ordersPage.notes')}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateItem(item.id)}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
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
                      onClick={() => onStartEdit(item)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
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
      {items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm font-medium">
            <span>{t('admin.ordersPage.itemsSubtotal')}:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
