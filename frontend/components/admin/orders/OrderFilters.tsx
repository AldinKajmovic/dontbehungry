'use client'

import { SearchableSelect } from '@/components/ui'
import { RangeFilter } from '@/components/admin/RangeFilter'
import { OrderFilters as OrderFiltersType } from '@/services/admin'

interface OrderFiltersProps {
  t: (key: string) => string
  filters: OrderFiltersType
  hasActiveFilters: boolean
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  loadCustomerOptions: (search: string) => Promise<{ value: string; label: string }[]>
  loadDriverOptions: (search: string) => Promise<{ value: string; label: string }[]>
}

const inputClasses = 'w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100'

export function OrderFiltersSection({
  t,
  filters,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
  loadCustomerOptions,
  loadDriverOptions,
}: OrderFiltersProps) {
  const STATUS_FILTER_OPTIONS = [
    { value: '', label: t('admin.orderStatus.allStatuses') },
    { value: 'PENDING', label: t('admin.orderStatus.PENDING') },
    { value: 'CONFIRMED', label: t('admin.orderStatus.CONFIRMED') },
    { value: 'PREPARING', label: t('admin.orderStatus.PREPARING') },
    { value: 'READY_FOR_PICKUP', label: t('admin.orderStatus.READY_FOR_PICKUP') },
    { value: 'OUT_FOR_DELIVERY', label: t('admin.orderStatus.OUT_FOR_DELIVERY') },
    { value: 'DELIVERED', label: t('admin.orderStatus.DELIVERED') },
    { value: 'CANCELLED', label: t('admin.orderStatus.CANCELLED') },
  ]

  const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: t('admin.paymentStatus.allPayments') },
    { value: 'PENDING', label: t('admin.paymentStatus.PENDING') },
    { value: 'COMPLETED', label: t('admin.paymentStatus.COMPLETED') },
    { value: 'FAILED', label: t('admin.paymentStatus.FAILED') },
    { value: 'REFUNDED', label: t('admin.paymentStatus.REFUNDED') },
  ]

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <SearchableSelect
            label={t('admin.filters.customer')}
            id="filter-customer"
            value={filters.customerId || ''}
            onChange={(value) => onFilterChange('customerId', value)}
            loadOptions={loadCustomerOptions}
            placeholder={t('admin.filters.allCustomers')}
            emptyMessage={t('admin.modals.noCustomersFound')}
          />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">{t('admin.columns.status')}</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className={inputClasses}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">{t('admin.paymentStatus.label')}</label>
          <select
            value={filters.paymentStatus || ''}
            onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
            className={inputClasses}
          >
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <RangeFilter
          label={t('admin.filters.totalAmount')}
          minValue={filters.minTotalAmount || ''}
          maxValue={filters.maxTotalAmount || ''}
          onMinChange={(value) => onFilterChange('minTotalAmount', value)}
          onMaxChange={(value) => onFilterChange('maxTotalAmount', value)}
          min={0}
          max={1000}
          step={1}
          prefix="$"
        />
        <div className="min-w-[280px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">{t('admin.filters.createdDate')}</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.createdAtFrom || ''}
              onChange={(e) => onFilterChange('createdAtFrom', e.target.value)}
              className={`flex-1 ${inputClasses}`}
            />
            <span className="text-gray-400 dark:text-neutral-500">{t('admin.ordersPage.to')}</span>
            <input
              type="date"
              value={filters.createdAtTo || ''}
              onChange={(e) => onFilterChange('createdAtTo', e.target.value)}
              className={`flex-1 ${inputClasses}`}
            />
          </div>
        </div>
        <div className="min-w-[200px]">
          <SearchableSelect
            label={t('admin.filters.driver')}
            id="filter-driver"
            value={filters.driverId || ''}
            onChange={(value) => onFilterChange('driverId', value)}
            loadOptions={loadDriverOptions}
            placeholder={t('admin.filters.allDrivers')}
            emptyMessage={t('admin.modals.noDriversFound')}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            {t('admin.clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
