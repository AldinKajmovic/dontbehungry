'use client'

import { useLanguage } from '@/hooks/useLanguage'

interface CartSummaryProps {
  itemCount: number
  subtotal: number
  tax: number
  deliveryFee: number
  minOrderFee: number
  total: number
  minOrderAmount?: number
  formatPrice: (price: number) => string
}

export function CartSummary({
  itemCount,
  subtotal,
  tax,
  deliveryFee,
  minOrderFee,
  total,
  minOrderAmount,
  formatPrice,
}: CartSummaryProps) {
  const { t } = useLanguage()

  return (
    <>
      {/* Summary */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>{t('cart.subtotal')} ({itemCount} {t('common.items')})</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{t('cart.tax')} (20%)</span>
          <span>${formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{t('cart.deliveryFee')}</span>
          <span>${formatPrice(deliveryFee)}</span>
        </div>
        {minOrderFee > 0 && (
          <div className="flex justify-between text-amber-600">
            <span>{t('cart.smallOrderFee')}</span>
            <span>${formatPrice(minOrderFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900 text-base pt-2 border-t">
          <span>{t('cart.total')}</span>
          <span>${formatPrice(total)}</span>
        </div>
      </div>

      {/* Small Order Fee Notice */}
      {minOrderFee > 0 && minOrderAmount !== undefined && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            A ${formatPrice(minOrderFee)} small order fee applies because your order is below the ${formatPrice(minOrderAmount)} minimum.
          </p>
        </div>
      )}
    </>
  )
}
