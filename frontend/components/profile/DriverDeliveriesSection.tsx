'use client'

import { Button, Section } from '@/components/ui'
import { useDriverDeliveries } from './hooks'
import { formatDate, getStatusColor } from './utils'
import { useLanguage } from '@/hooks/useLanguage'

export function DriverDeliveriesSection() {
  const { t } = useLanguage()
  const {
    deliveries,
    loading,
    show,
    isDriver,
    page,
    totalPages,
    total,
    status,
    toggleShow,
    handleStatusChange,
    goToPage,
  } = useDriverDeliveries()

  if (!isDriver) return null

  return (
    <Section
      title={t('profile.deliveries.title')}
      description={t('profile.deliveries.description')}
      headerAction={
        <Button
          type="button"
          variant="secondary"
          className="!w-auto !py-2 !px-4 text-sm"
          onClick={toggleShow}
        >
          <span className="flex items-center gap-2">
            {show ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {show ? t('profile.deliveries.hide') : t('profile.deliveries.show')}
          </span>
        </Button>
      }
    >
      {show && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <label htmlFor="driverDeliveriesStatus" className="text-sm font-medium text-gray-700 dark:text-neutral-300">
              {t('profile.deliveries.filterByStatus')}
            </label>
            <select
              id="driverDeliveriesStatus"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[180px] dark:bg-neutral-800 dark:text-white"
            >
              <option value="">{t('profile.deliveries.allStatuses')}</option>
              <option value="PENDING">{t('orders.status.PENDING')}</option>
              <option value="CONFIRMED">{t('orders.status.CONFIRMED')}</option>
              <option value="PREPARING">{t('orders.status.PREPARING')}</option>
              <option value="READY_FOR_PICKUP">{t('orders.status.READY_FOR_PICKUP')}</option>
              <option value="OUT_FOR_DELIVERY">{t('orders.status.OUT_FOR_DELIVERY')}</option>
              <option value="DELIVERED">{t('orders.status.DELIVERED')}</option>
              <option value="CANCELLED">{t('orders.status.CANCELLED')}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-neutral-400">{t('profile.deliveries.noDeliveries')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {total === 1
                  ? t('profile.deliveries.deliveriesFoundSingular', { count: total })
                  : t('profile.deliveries.deliveriesFoundPlural', { count: total })
                }
              </p>
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-primary-900 hover:border-primary-900 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-white">
                            {t('profile.deliveries.orderFor')} {delivery.customerFirstName || 'Customer'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(delivery.status)} group-hover:bg-transparent group-hover:text-white/80`}>
                            {t(`orders.status.${delivery.status}`)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-neutral-400 group-hover:text-white/70 mb-1">
                          {t('profile.deliveries.from')}: <span className="font-medium group-hover:text-white">{delivery.restaurant.name}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 group-hover:text-white/60 mb-2">
                          {formatDate(delivery.createdAt)}
                        </p>
                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-neutral-400 group-hover:text-white/60">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p>{delivery.deliveryPlace.address}, {delivery.deliveryPlace.city}</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-neutral-400 group-hover:text-white/70 mt-2">
                          <p className="font-medium">{t('profile.deliveries.items')}: {delivery.orderItems.length}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-primary-600 dark:text-primary-400 group-hover:text-white">${delivery.totalAmount}</p>
                        {delivery.deliveredAt && (
                          <p className="text-xs text-green-600 group-hover:text-white/60 mt-1">
                            {t('profile.deliveries.delivered')}: {formatDate(delivery.deliveredAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-800">
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {t('profile.deliveries.page')} {page} {t('profile.deliveries.of')} {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 1 || loading}
                      className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Section>
  )
}
