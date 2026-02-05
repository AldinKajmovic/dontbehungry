'use client'

import { PaymentMethod } from '@/providers/CartProvider'
import { useLanguage } from '@/hooks/useLanguage'

const PAYMENT_METHODS: { value: PaymentMethod; labelKey: string; descriptionKey: string }[] = [
  { value: 'CASH', labelKey: 'payment.cash', descriptionKey: 'payment.cashDescription' },
  { value: 'CREDIT_CARD', labelKey: 'payment.creditCard', descriptionKey: 'payment.creditCardDescription' },
  { value: 'DIGITAL_WALLET', labelKey: 'payment.digitalWallet', descriptionKey: 'payment.digitalWalletDescription' },
]

interface PaymentMethodSectionProps {
  selectedMethod: PaymentMethod
  onSelect: (method: PaymentMethod) => void
}

export function PaymentMethodSection({ selectedMethod, onSelect }: PaymentMethodSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="border-t pt-4">
      <h3 className="font-medium text-gray-900 mb-3">{t('cart.paymentMethod')}</h3>
      <p className="text-sm text-gray-500 mb-3">
        {t('cart.paymentOnDelivery')}
      </p>
      <div className="space-y-2">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.value}
            className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${selectedMethod === method.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={selectedMethod === method.value}
              onChange={() => onSelect(method.value)}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{t(method.labelKey)}</p>
              <p className="text-xs text-gray-500">{t(method.descriptionKey)}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
