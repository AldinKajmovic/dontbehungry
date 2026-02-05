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
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.columns.status')}</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.paymentStatus.label')}</label>
          <select
            value={filters.paymentStatus || ''}
            onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.filters.createdDate')}</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.createdAtFrom || ''}
              onChange={(e) => onFilterChange('createdAtFrom', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
            <span className="text-gray-400">{t('admin.ordersPage.to')}</span>
            <input
              type="date"
              value={filters.createdAtTo || ''}
              onChange={(e) => onFilterChange('createdAtTo', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
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
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('admin.clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
