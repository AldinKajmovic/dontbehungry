'use client'

import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { AvailableOrderEvent } from '@/services/profile/types'

interface DriverOrderQueueItemProps {
  order: AvailableOrderEvent
  onAccept: (orderId: string) => void
  onDeny: (orderId: string) => void
  isAccepting: boolean
}

export default function DriverOrderQueueItem({
  order,
  onAccept,
  onDeny,
  isAccepting,
}: DriverOrderQueueItemProps) {
  const { t } = useLanguage()
  const [confirmDeny, setConfirmDeny] = useState(false)

  const timeAgo = getTimeAgo(order.createdAt)

  return (
    <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      {/* Restaurant name */}
      <div className="mb-2 flex items-start justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {order.restaurantName}
        </h4>
        <span className="ml-2 whitespace-nowrap text-xs text-gray-500 dark:text-neutral-400">
          {timeAgo}
        </span>
      </div>

      {/* Addresses */}
      <div className="mb-3 space-y-1 text-xs text-gray-600 dark:text-neutral-400">
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
          <span>{order.restaurantAddress}</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
          <span>{order.deliveryAddress}</span>
        </div>
      </div>

      {/* Order details */}
      <div className="mb-3 flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400">
        <span className="font-medium text-gray-900 dark:text-white">
          {Number(order.totalAmount).toFixed(2)} KM
        </span>
        <span>
          {order.itemCount} {t('driver.orderQueue.items')}
        </span>
        {order.estimatedDistance !== null && (
          <span>
            ~{order.estimatedDistance} km
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(order.orderId)}
          disabled={isAccepting}
          className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAccepting
            ? t('driver.orderQueue.accepting')
            : t('driver.orderQueue.accept')}
        </button>

        {confirmDeny ? (
          <button
            onClick={() => {
              onDeny(order.orderId)
              setConfirmDeny(false)
            }}
            className="flex-1 rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            {t('driver.orderQueue.denyConfirm')}
          </button>
        ) : (
          <button
            onClick={() => setConfirmDeny(true)}
            className="flex-1 rounded-md bg-gray-100 dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700"
          >
            {t('driver.orderQueue.deny')}
          </button>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(isoDate: string): string {
  const now = Date.now()
  const created = new Date(isoDate).getTime()
  const diffMs = now - created
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return '<1m'
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ${diffMin % 60}m`
}
