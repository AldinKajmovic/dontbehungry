'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Input, Button, Alert, Modal, AddressAutocomplete, OpeningHoursForm } from '@/components/ui'
import { MyRestaurant } from '@/services/profile'

interface OpeningHoursEntry {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

interface RestaurantFormState {
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  postalCode: string
  minOrderAmount: string
  deliveryFee: string
  images: string[]
  openingHours: OpeningHoursEntry[]
}

interface RestaurantFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingRestaurant: MyRestaurant | null
  form: RestaurantFormState
  formLoading: boolean
  error: string
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleAddressSelect?: (addr: {
    address: string
    city: string
    state: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
  }) => void
  removeImage: (index: number) => void
  onAddImage?: () => void
  imageUploading?: boolean
  handleSubmit: (e: React.FormEvent) => void
  onOpeningHoursChange?: (hours: OpeningHoursEntry[]) => void
}

const RestaurantIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

export function RestaurantFormModal({
  isOpen,
  onClose,
  editingRestaurant,
  form,
  formLoading,
  error,
  handleChange,
  handleAddressSelect,
  removeImage,
  onAddImage,
  imageUploading,
  handleSubmit,
  onOpeningHoursChange,
}: RestaurantFormModalProps) {
  const { t } = useLanguage()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
      icon={RestaurantIcon}
      iconColor="primary"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label="Restaurant Name"
          type="text"
          id="restaurantName"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your restaurant name"
        />

        <div>
          <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            Description <span className="text-gray-400 dark:text-neutral-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="restaurantDescription"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your restaurant..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('restaurant.phone')}
            type="tel"
            id="restaurantPhone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 234 567 8900"
            required
          />
          <Input
            label={t('restaurant.email')}
            type="email"
            id="restaurantEmail"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="contact@restaurant.com"
            hint={`(${t('common.optional')})`}
          />
        </div>

        {/* Gallery Section */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mb-2">Gallery (Interior, Exterior, etc.)</p>
          <div className="grid grid-cols-3 gap-3">
            {form.images.map((imgUrl, index) => (
              <div key={index} className="relative group">
                <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
                  <img
                    src={imgUrl}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {form.images.length < 6 && (
              <button
                type="button"
                onClick={onAddImage}
                disabled={imageUploading}
                className="group flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {imageUploading ? (
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mt-1">{form.images.length} / 6</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-2">{t('upload.galleryHint')}</p>
        </div>

        {/* Opening Hours */}
        {onOpeningHoursChange && (
          <OpeningHoursForm
            value={form.openingHours}
            onChange={onOpeningHoursChange}
          />
        )}

        {!editingRestaurant && (
          <>
            <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mt-4 mb-2">{t('admin.modals.location')}</p>
            <AddressAutocomplete
              label={t('address.streetAddress')}
              placeholder={t('address.searchPlaceholder')}
              onAddressSelect={handleAddressSelect || (() => {})}
              height="150px"
            />
          </>
        )}

        <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mt-4 mb-2">Delivery Settings</p>

        <div className="grid grid-cols-2 gap-4 items-start">
          <Input
            label="Min. Order"
            type="number"
            step="0.01"
            min="0"
            id="minOrderAmount"
            name="minOrderAmount"
            value={form.minOrderAmount}
            onChange={handleChange}
            placeholder="0.00"
            prefix="$"
            hint="(optional)"
          />
          <Input
            label="Delivery Fee"
            type="number"
            step="0.01"
            min="0"
            id="deliveryFee"
            name="deliveryFee"
            value={form.deliveryFee}
            onChange={handleChange}
            placeholder="0.00"
            prefix="$"
            hint="(optional)"
          />
        </div>

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
            {formLoading ? 'Saving...' : editingRestaurant ? 'Save Changes' : 'Add Restaurant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
