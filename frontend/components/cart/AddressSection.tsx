'use client'

import { Address } from '@/services/address'
import { useLanguage } from '@/hooks/useLanguage'

interface AddressSectionProps {
  addresses: Address[]
  selectedAddressId: string | null
  isLoading: boolean
  onSelectAddress: (id: string) => void
  onAddNew: () => void
}

export function AddressSection({
  addresses,
  selectedAddressId,
  isLoading,
  onSelectAddress,
  onAddNew,
}: AddressSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="border-t dark:border-neutral-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">{t('cart.deliveryAddress')}</h3>
        <button
          onClick={onAddNew}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('cart.addNew')}
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-neutral-400 text-sm mb-2">{t('cart.noSavedAddresses')}</p>
          <button
            onClick={onAddNew}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
          >
            {t('cart.addAnAddress')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${selectedAddressId === address.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                }
              `}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === address.id}
                onChange={() => onSelectAddress(address.id)}
                className="mt-1 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{address.address}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{address.city}, {address.country}</p>
                {address.notes && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {address.notes}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
