'use client'

import { useEffect } from 'react'
import { Button, Modal } from '@/components/ui'
import { MyRestaurant } from '@/services/profile'
import { useRestaurantOrders } from './hooks'

interface RestaurantOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: MyRestaurant | null
}

const OrdersIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

export function RestaurantOrdersModal({
  isOpen,
  onClose,
  restaurant,
}: RestaurantOrdersModalProps) {
  const {
    orders,
    loading,
    page,
    totalPages,
    total,
    status,
    error,
    openModal,
    closeModal,
    handleStatusChange,
    handleUpdateOrderStatus,
    goToPage,
  } = useRestaurantOrders(restaurant?.id || null)

  useEffect(() => {
    if (isOpen && restaurant) {
      openModal()
    } else {
      closeModal()
    }
  }, [isOpen, restaurant, openModal, closeModal])

  const handleClose = () => {
    closeModal()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Orders - ${restaurant?.name || ''}`}
      icon={OrdersIcon}
      iconColor="primary"
      size="lg"
    >
      <div className="space-y-4">
        {/* Back button */}
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Restaurant
        </button>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <label htmlFor="restaurantOrdersStatusFilter" className="text-sm font-medium text-gray-700 dark:text-neutral-300">
            Filter by status:
          </label>
          <select
            id="restaurantOrdersStatusFilter"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[180px] dark:bg-neutral-800 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Orders count */}
        <div className="text-sm text-gray-500 dark:text-neutral-400">
          {total} order{total !== 1 ? 's' : ''} found
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 && !error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-neutral-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {orders.map((order) => (
              <div key={order.id} className="p-4 rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Order #{order.id.slice(-6)}</p>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">{order.customerName}</p>
                    {order.customerPhone && (
                      <p className="text-xs text-gray-400 dark:text-neutral-500">{order.customerPhone}</p>
                    )}
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      order.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : order.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                    disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
                  <p>Delivery: {order.deliveryPlace.address}, {order.deliveryPlace.city}</p>
                  <p className="text-xs text-gray-400 dark:text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString()} at{' '}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="border-t border-gray-100 dark:border-neutral-800 pt-2">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Items:</p>
                  <ul className="text-sm text-gray-600 dark:text-neutral-400">
                    {order.orderItems.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-neutral-800 font-medium">
                    <span>Total</span>
                    <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
                {order.payment && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
                    Payment: {order.payment.method} ({order.payment.status})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="secondary"
              className="!w-auto !py-2 !px-4 text-sm"
              disabled={page === 1 || loading}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500 dark:text-neutral-400">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              className="!w-auto !py-2 !px-4 text-sm"
              disabled={page === totalPages || loading}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
