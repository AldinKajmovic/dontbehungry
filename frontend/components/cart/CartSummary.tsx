'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { DeliveryInfo } from '@/services/profile'

interface CartSummaryProps {
  itemCount: number
  subtotal: number
  tax: number
  deliveryInfo: DeliveryInfo | null
  fallbackDeliveryFee: number
  isLoadingDelivery: boolean
  minOrderFee: number
  minOrderAmount?: number
  formatPrice: (price: number) => string
}

export function CartSummary({
  itemCount,
  subtotal,
  tax,
  deliveryInfo,
  fallbackDeliveryFee,
  isLoadingDelivery,
  minOrderFee,
  minOrderAmount,
  formatPrice,
}: CartSummaryProps) {
  const { t } = useLanguage()

  const deliveryFee = deliveryInfo?.totalFee ?? fallbackDeliveryFee
  const total = subtotal + deliveryFee + tax + minOrderFee

  return (
    <>
      {/* Delivery Info */}
      {deliveryInfo && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
          <div className="flex items-center gap-2 text-blue-800 text-sm mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{deliveryInfo.distanceText}</span>
            <span className="text-blue-600">•</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{deliveryInfo.durationText}</span>
          </div>
          {deliveryInfo.isWeatherBad && (
            <div className="flex items-center gap-1 text-amber-700 text-xs mt-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{t('cart.badWeatherSurcharge', { weather: deliveryInfo.weatherCondition || 'Bad weather' })}</span>
            </div>
          )}
          <p className="text-xs text-blue-600 mt-1 italic">{t('cart.preparationNote')}</p>
        </div>
      )}

      {/* Loading indicator for delivery */}
      {isLoadingDelivery && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>{t('cart.calculatingDelivery')}</span>
        </div>
      )}

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
          <span>
            {t('cart.deliveryFee')}
            {deliveryInfo?.weatherSurcharge ? ` (+$${formatPrice(deliveryInfo.weatherSurcharge)} ${t('cart.weather')})` : ''}
          </span>
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
