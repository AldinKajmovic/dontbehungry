'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Input, Button, Alert, Section, Modal } from '@/components/ui'
import { useAddresses } from './hooks'

const LocationIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export function AddressSection() {
  const { t } = useLanguage()
  const {
    addresses,
    loading,
    showModal,
    editingAddress,
    form,
    formLoading,
    error,
    handleChange,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleSetDefault,
  } = useAddresses()

  return (
    <>
      <Section
        title={t('profile.myAddresses')}
        description={t('profile.manageAddresses')}
        headerAction={
          <Button
            type="button"
            variant="secondary"
            className="!w-auto !py-2 !px-4 text-sm"
            onClick={openAddModal}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('profile.addAddress')}
            </span>
          </Button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">{t('profile.noAddresses')}</p>
            <Button
              type="button"
              variant="secondary"
              className="!w-auto !py-2 !px-4"
              onClick={openAddModal}
            >
              {t('profile.addFirstAddress')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`relative p-4 rounded-xl border-2 transition-colors ${
                  address.isDefault
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {address.isDefault && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{address.address}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {address.city}, {address.country}
                    </p>
                    {address.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{address.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(address)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {t('common.edit')}
                  </button>
                  {!address.isDefault && (
                    <>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        {t('address.setAsDefault')}
                      </button>
                    </>
                  )}
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingAddress ? t('address.editAddress') : t('address.addNew')}
        icon={LocationIcon}
        iconColor="primary"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <Input
            label={t('address.streetAddress')}
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder={t('address.streetAddressPlaceholder')}
            autoComplete="street-address"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('address.city')}
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder={t('address.cityPlaceholder')}
              autoComplete="address-level2"
            />
            <Input
              label={t('address.state')}
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder={t('address.statePlaceholder')}
              hint={`(${t('common.optional')})`}
              autoComplete="address-level1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('address.country')}
              id="country"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder={t('address.countryPlaceholder')}
              autoComplete="country-name"
            />
            <Input
              label={t('address.postalCode')}
              id="postalCode"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              placeholder={t('address.postalCodePlaceholder')}
              hint={`(${t('common.optional')})`}
              autoComplete="postal-code"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {t('address.deliveryNotes')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder={t('address.deliveryNotesPlaceholder')}
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeModal}
              disabled={formLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {formLoading ? t('common.loading') : editingAddress ? t('common.save') : t('address.addAddress')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
