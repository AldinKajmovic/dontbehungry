'use client'

import { DataTable } from '@/components/admin/DataTable'
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/components/admin/StatusSelect'
import { AdminOrder, SortParams } from '@/services/admin'

interface OrdersTableProps {
  t: (key: string) => string
  orders: AdminOrder[]
  isLoading: boolean
  sort: SortParams
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onEdit: (order: AdminOrder) => void
  onDelete: (order: AdminOrder) => void
}

export function OrdersTable({
  t,
  orders,
  isLoading,
  sort,
  onSort,
  onEdit,
  onDelete,
}: OrdersTableProps) {
  const columns = [
    {
      key: 'id',
      header: t('admin.columns.order'),
      render: (order: AdminOrder) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white font-mono text-sm break-all">{order.id}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400">{order.restaurant.name}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: t('admin.columns.customer'),
      render: (order: AdminOrder) => (
        <div>
          <p className="text-sm">{order.user.firstName} {order.user.lastName}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400">{order.user.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('admin.columns.status'),
      sortable: true,
      render: (order: AdminOrder) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {t(`admin.orderStatus.${order.status}`)}
        </span>
      ),
    },
    {
      key: 'items',
      header: t('admin.columns.items'),
      render: (order: AdminOrder) => (
        <span className="text-sm text-gray-600 dark:text-neutral-300">
          {order.orderItems?.length || 0} {t('admin.columns.items').toLowerCase()}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: t('admin.columns.total'),
      sortable: true,
      render: (order: AdminOrder) => (
        <span className="font-medium">${parseFloat(order.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      key: 'payment',
      header: t('admin.columns.payment'),
      render: (order: AdminOrder) => (
        order.payment ? (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${PAYMENT_STATUS_COLORS[order.payment.status] || 'bg-gray-100 text-gray-700'}`}>
            {t(`admin.paymentStatus.${order.payment.status}`)}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-neutral-500">-</span>
        )
      ),
    },
    {
      key: 'driver',
      header: t('admin.columns.driver'),
      render: (order: AdminOrder) => (
        order.driver ? (
          <span className="text-sm">{order.driver.firstName} {order.driver.lastName}</span>
        ) : (
          <span className="text-gray-400">{t('admin.modals.unassigned')}</span>
        )
      ),
    },
    {
      key: 'createdAt',
      header: t('admin.columns.date'),
      sortable: true,
      render: (order: AdminOrder) => (
        <span className="text-sm text-gray-500 dark:text-neutral-400">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={orders}
      keyField="id"
      isLoading={isLoading}
      emptyMessage={t('admin.noOrdersFound')}
      sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
      onSort={onSort}
      actions={(order) => (
        <>
          <button
            onClick={() => onEdit(order)}
            className="p-2 text-gray-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(order)}
            className="p-2 text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </>
      )}
    />
  )
}
