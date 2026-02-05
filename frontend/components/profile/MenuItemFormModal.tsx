'use client'

import { Input, Button, Alert, Modal } from '@/components/ui'
import { MyMenuItem, Category } from '@/services/profile'

interface MenuItemFormState {
  name: string
  description: string
  price: string
  imageUrl: string
  categoryId: string
  isAvailable: boolean
  preparationTime: string
}

interface MenuItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingItem: MyMenuItem | null
  form: MenuItemFormState
  categories: Category[]
  formLoading: boolean
  error: string
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSubmit: (e: React.FormEvent) => void
}

const PlusIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

export function MenuItemFormModal({
  isOpen,
  onClose,
  editingItem,
  form,
  categories,
  formLoading,
  error,
  handleChange,
  handleSubmit,
}: MenuItemFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      icon={PlusIcon}
      iconColor="primary"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label="Item Name"
          type="text"
          id="menuItemName"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g., Margherita Pizza"
        />

        <div>
          <label htmlFor="menuItemDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="menuItemDescription"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the item..."
            rows={2}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            id="menuItemPrice"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="0.00"
            prefix="$"
          />
          <Input
            label="Preparation Time (min)"
            type="number"
            min="0"
            id="menuItemPreparationTime"
            name="preparationTime"
            value={form.preparationTime}
            onChange={handleChange}
            placeholder="15"
            hint="(optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="menuItemCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="menuItemCategory"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer mt-6">
              <input
                type="checkbox"
                name="isAvailable"
                checked={form.isAvailable}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Available</span>
            </label>
          </div>
        </div>

        <Input
          label="Image URL"
          type="url"
          id="menuItemImageUrl"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          hint="(optional)"
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={formLoading}>
            {formLoading ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
