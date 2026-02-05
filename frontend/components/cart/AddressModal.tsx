'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Modal, Input, Button, Alert } from '@/components/ui'

const LocationIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

interface AddressForm {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  notes: string
}

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  form: AddressForm
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  isLoading: boolean
  error: string
}

export function AddressModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onChange,
  isLoading,
  error,
}: AddressModalProps) {
  const { t } = useLanguage()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('address.addNew')}
      icon={LocationIcon}
      iconColor="primary"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <Alert type="error">{error}</Alert>
        )}

        <Input
          label={t('address.streetAddress')}
          id="cart-address"
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="123 Main Street, Apt 4"
          autoComplete="street-address"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('address.city')}
            id="cart-city"
            name="city"
            value={form.city}
            onChange={onChange}
            placeholder="New York"
            autoComplete="address-level2"
          />
          <Input
            label={t('address.state')}
            id="cart-state"
            name="state"
            value={form.state}
            onChange={onChange}
            placeholder="NY"
            hint={`(${t('common.optional')})`}
            autoComplete="address-level1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('address.country')}
            id="cart-country"
            name="country"
            value={form.country}
            onChange={onChange}
            placeholder="USA"
            autoComplete="country-name"
          />
          <Input
            label={t('address.postalCode')}
            id="cart-postalCode"
            name="postalCode"
            value={form.postalCode}
            onChange={onChange}
            placeholder="10001"
            hint={`(${t('common.optional')})`}
            autoComplete="postal-code"
          />
        </div>

        <div>
          <label htmlFor="cart-notes" className="block text-sm font-medium text-gray-700 mb-2">
            {t('address.deliveryNotes')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
          </label>
          <textarea
            id="cart-notes"
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder={t('address.deliveryNotesPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
          >
            {isLoading ? t('common.loading') : t('address.addAddress')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
