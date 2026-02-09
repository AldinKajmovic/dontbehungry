'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  className?: string
  sortable?: boolean
  sortKey?: string // Optional different key for sorting (e.g., nested fields)
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  actions?: (item: T) => ReactNode
  sortConfig?: SortConfig
  onSort?: (key: string, direction: 'asc' | 'desc') => void
}

function SortIcon({ direction, active }: { direction?: 'asc' | 'desc'; active: boolean }) {
  // Show up triangle for asc, down triangle for desc (or default down when not active)
  const isAsc = active && direction === 'asc'

  return (
    <span className="ml-2 inline-flex items-center">
      <svg
        className={`w-3.5 h-3.5 transition-colors ${
          active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-300 dark:text-neutral-600'
        }`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        {isAsc ? (
          <path d="M12 5l-8 8h16z" />
        ) : (
          <path d="M12 19l-8-8h16z" />
        )}
      </svg>
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage = 'No data found',
  onRowClick,
  actions,
  sortConfig,
  onSort,
}: DataTableProps<T>) {
  const { t } = useLanguage()

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return

    const sortKey = column.sortKey || column.key
    const isActive = sortConfig?.key === sortKey
    const newDirection = isActive && sortConfig?.direction === 'desc' ? 'asc' : 'desc'
    onSort(sortKey, newDirection)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-neutral-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-100 dark:border-neutral-800">
              {columns.map((column) => {
                const sortKey = column.sortKey || column.key
                const isActive = sortConfig?.key === sortKey
                return (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-neutral-400 tracking-wider ${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 select-none' : ''}`}
                    onClick={() => handleSort(column)}
                  >
                    <span className="flex items-center">
                      {column.header}
                      {column.sortable && (
                        <SortIcon
                          direction={isActive ? sortConfig?.direction : undefined}
                          active={isActive}
                        />
                      )}
                    </span>
                  </th>
                )
              })}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-neutral-400 tracking-wider">
                  {t('admin.table.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {data.map((item) => (
              <tr
                key={String(item[keyField])}
                className={`transition-colors hover:bg-primary-900 ${onRowClick ? 'cursor-pointer' : ''} [&:hover_td]:!text-white [&:hover_td_*]:!text-white [&:hover_td_.rounded-full]:!bg-transparent`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-sm text-gray-700 dark:text-neutral-300 ${column.className || ''}`}>
                    {column.render ? column.render(item) : String(item[column.key] ?? '-')}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {actions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
