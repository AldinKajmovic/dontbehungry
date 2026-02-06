'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDriverOrderQueue } from '@/components/profile/hooks/useDriverOrderQueue'
import DriverOrderQueueBadge from './DriverOrderQueueBadge'
import DriverOrderQueue from './DriverOrderQueue'

export default function DriverOrderQueueOverlay() {
  const { user } = useAuth()
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const {
    orders,
    orderCount,
    isLoading,
    acceptingOrderId,
    acceptOrder,
    denyOrder,
    isDriver,
    isAvailable,
    page,
    totalPages,
    total,
    goToPage,
    refresh,
  } = useDriverOrderQueue()

  const handleOpenPanel = () => {
    setIsPanelOpen(true)
    refresh()
  }

  // Only render for delivery drivers who are online
  if (!user || !isDriver || !isAvailable) return null

  return (
    <>
      <DriverOrderQueueBadge
        orderCount={orderCount}
        onClick={handleOpenPanel}
      />

      <DriverOrderQueue
        orders={orders}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onAccept={acceptOrder}
        onDeny={denyOrder}
        acceptingOrderId={acceptingOrderId}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={goToPage}
      />
    </>
  )
}
