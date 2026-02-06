'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { useDriverTracking } from './hooks/useDriverTracking'
import { OrderTrackingMap } from './OrderTrackingMap'

interface OrderTrackingModalProps {
  orderId: string
  destination: {
    lat: number
    lng: number
    address: string
    city: string
  }
  onClose: () => void
}

export function OrderTrackingModal({
  orderId,
  destination,
  onClose,
}: OrderTrackingModalProps) {
  const { t } = useLanguage()
  const { location, loading, error, isStale, refresh } = useDriverTracking({
    orderId,
    enabled: true,
  })
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('orders.tracking.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label={t('orders.tracking.close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500">{t('orders.tracking.loadingLocation')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-700 font-medium mb-2">{t('orders.tracking.errorLoading')}</p>
              <button
                onClick={refresh}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {t('orders.tracking.tryAgain')}
              </button>
            </div>
          ) : !location ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-700 font-medium mb-1">{t('orders.tracking.waitingForLocation')}</p>
              <p className="text-gray-500 text-sm text-center">
                {t('orders.tracking.driverWillAppear')}
              </p>
            </div>
          ) : (
            <>
              {/* Map */}
              <OrderTrackingMap
                driverLocation={location}
                destination={{ lat: destination.lat, lng: destination.lng }}
                height="350px"
              />

              {/* Stale warning */}
              {isStale && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-amber-800 font-medium text-sm">
                      {t('orders.tracking.locationStaleWarning')}
                    </p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      {t('orders.tracking.locationStaleDescription')}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery address */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('orders.tracking.deliveringTo')}</p>
                <p className="text-sm text-gray-900 font-medium">
                  {destination.address}, {destination.city}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            {t('orders.tracking.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
