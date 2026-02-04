'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useSocket } from '@/providers/SocketProvider'
import { profileService, OrderHistoryItem } from '@/services/profile'
import { NotificationBell } from '@/components/notifications'
import { LanguageToggle } from '@/components/ui'
import { Notification } from '@/services/notification'
import { logger } from '@/utils/logger'

const ORDER_STATUS_KEYS = [
  { value: '', labelKey: 'orders.status.all' },
  { value: 'PENDING', labelKey: 'orders.status.PENDING' },
  { value: 'CONFIRMED', labelKey: 'orders.status.CONFIRMED' },
  { value: 'PREPARING', labelKey: 'orders.status.PREPARING' },
  { value: 'READY_FOR_PICKUP', labelKey: 'orders.status.READY_FOR_PICKUP' },
  { value: 'OUT_FOR_DELIVERY', labelKey: 'orders.status.OUT_FOR_DELIVERY' },
  { value: 'DELIVERED', labelKey: 'orders.status.DELIVERED' },
  { value: 'CANCELLED', labelKey: 'orders.status.CANCELLED' },
]

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800'
    case 'PREPARING':
      return 'bg-purple-100 text-purple-800'
    case 'READY_FOR_PICKUP':
      return 'bg-indigo-100 text-indigo-800'
    case 'OUT_FOR_DELIVERY':
      return 'bg-orange-100 text-orange-800'
    case 'DELIVERED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useLanguage()
  const { socket, isConnected } = useSocket()
  const router = useRouter()

  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Ref to track current page for socket callback
  const pageRef = useRef(page)
  pageRef.current = page

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  const loadOrders = useCallback(async (pageNum: number, silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const result = await profileService.getMyOrderHistory({
        page: pageNum,
        limit: 10,
        status: statusFilter || undefined,
        createdAtFrom: fromDate || undefined,
        createdAtTo: toDate || undefined,
      })
      setOrders(result.orders)
      setPage(result.pagination.page)
      setTotalPages(result.pagination.totalPages)
      setTotal(result.pagination.total)
      setLastUpdate(new Date())
    } catch (error) {
      logger.error('Failed to load orders', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [statusFilter, fromDate, toDate])

  // Load orders on mount and when filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders(1)
    }
  }, [isAuthenticated, statusFilter, fromDate, toDate, loadOrders])

  // Listen for real-time order status updates via socket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNotification = (notification: Notification) => {
      // Refresh orders when we receive an order status notification
      if (notification.type === 'ORDER_STATUS') {
        // Silently refresh current page to update the status
        loadOrders(pageRef.current, true)
      }
    }

    socket.on('notification', handleNotification)

    return () => {
      socket.off('notification', handleNotification)
    }
  }, [socket, isConnected, loadOrders])

  const handlePageChange = (newPage: number) => {
    loadOrders(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    setStatusFilter('')
    setFromDate('')
    setToDate('')
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.push('/my-profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">{t('orders.backToProfile')}</span>
            </button>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
          <p className="text-gray-500 mt-1">{t('orders.subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Status Filter */}
            <div className="min-w-[180px]">
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('orders.status.label')}
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {ORDER_STATUS_KEYS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {t(status.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                {t('orders.filters.fromDate')}
              </label>
              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* To Date */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                {t('orders.filters.toDate')}
              </label>
              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500"
              />
            </div>

            {/* Clear Filters */}
            {(statusFilter || fromDate || toDate) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('common.clearFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-500">{t('orders.noOrders')}</p>
              {(statusFilter || fromDate || toDate) && (
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {t('orders.clearFiltersToSeeAll')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {t('orders.ordersFound', { count: total })}
                </p>
                {lastUpdate && (
                  <p className="text-xs text-gray-400">
                    {t('orders.updated')} {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Orders */}
              <div className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Left side */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{order.restaurant.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                            {t(`orders.status.${order.status}`)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{formatDate(order.createdAt)}</p>

                        {/* Order Items */}
                        <ul className="text-sm text-gray-600 mb-2">
                          {order.orderItems.slice(0, 3).map((item, idx) => (
                            <li key={idx}>
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                          {order.orderItems.length > 3 && (
                            <li className="text-gray-400">{t('orders.moreItems', { count: order.orderItems.length - 3 })}</li>
                          )}
                        </ul>

                        {/* Delivery Address */}
                        <p className="text-xs text-gray-400">
                          {t('orders.delivery')}: {order.deliveryPlace.address}, {order.deliveryPlace.city}
                        </p>
                      </div>

                      {/* Right side */}
                      <div className="text-right">
                        <p className="font-semibold text-lg text-primary-600">${order.totalAmount}</p>
                        {order.payment && (
                          <p className="text-xs text-gray-400 mt-1">
                            {order.payment.method.replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {t('common.page')} {page} {t('common.of')} {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1 || isLoading}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        {t('common.previous')}
                      </button>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages || isLoading}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        {t('common.next')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
