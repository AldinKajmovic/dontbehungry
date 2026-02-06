'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/providers/SocketProvider'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/hooks/useLanguage'
import { profileService } from '@/services/profile'
import {
  AvailableOrderEvent,
  OrderAcceptedEvent,
  OrderRemovedEvent,
} from '@/services/profile/types'
import { logger } from '@/utils/logger'

const PAGE_LIMIT = 10

export function useDriverOrderQueue() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const { toast } = useToast()
  const { t } = useLanguage()
  const isDriver = user?.role === 'DELIVERY_DRIVER'

  const [orders, setOrders] = useState<AvailableOrderEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [isAvailable, setIsAvailable] = useState(false)
  const prevConnectedRef = useRef(false)

  // Fetch a specific page
  const fetchPage = useCallback(async (targetPage: number) => {
    if (!isDriver) return

    try {
      setIsLoading(true)
      const response = await profileService.getAvailableOrders(targetPage, PAGE_LIMIT)
      setOrders(response.orders)
      setPage(response.pagination.page)
      setTotalPages(response.pagination.totalPages)
      setTotal(response.pagination.total)
    } catch (err) {
      logger.error('Failed to fetch order queue', err)
    } finally {
      setIsLoading(false)
    }
  }, [isDriver])

  // Check initial availability status on mount
  useEffect(() => {
    if (!isDriver) return

    profileService.getAvailabilityStatus()
      .then((status) => {
        setIsAvailable(status.isOnline)
        if (status.isOnline && isConnected) {
          fetchPage(1)
        }
      })
      .catch(() => {
        // Silently fail — availability status is secondary
      })
  }, [isDriver, isConnected, fetchPage])

  // Listen for availability toggle from useDriverAvailability
  useEffect(() => {
    const handler = (e: Event) => {
      const { isOnline } = (e as CustomEvent<{ isOnline: boolean }>).detail
      setIsAvailable(isOnline)
      if (isOnline) {
        // Small delay to let location report reach the backend first
        setTimeout(() => fetchPage(1), 1500)
      } else {
        setOrders([])
        setPage(1)
        setTotalPages(0)
        setTotal(0)
      }
    }

    window.addEventListener('driver:availability-changed', handler)
    return () => window.removeEventListener('driver:availability-changed', handler)
  }, [fetchPage])

  // Re-hydrate on reconnect
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current && isDriver && isAvailable) {
      fetchPage(1)
    }
    prevConnectedRef.current = isConnected
  }, [isConnected, isDriver, isAvailable, fetchPage])

  // Clear queue when going offline (socket disconnect)
  useEffect(() => {
    if (!isConnected && isDriver) {
      setOrders([])
      setPage(1)
      setTotalPages(0)
      setTotal(0)
    }
  }, [isConnected, isDriver])

  // Socket listeners
  useEffect(() => {
    if (!socket || !isDriver) return

    const handleAvailable = (data: AvailableOrderEvent) => {
      setIsAvailable(true)
      setTotal((prev) => prev + 1)
      setTotalPages((prev) => Math.ceil((prev * PAGE_LIMIT + 1) / PAGE_LIMIT))
      setOrders((prev) => {
        if (prev.some((o) => o.orderId === data.orderId)) return prev
        if (page === 1) {
          const updated = [data, ...prev]
          return updated.slice(0, PAGE_LIMIT)
        }
        return prev
      })
    }

    const handleAccepted = (data: OrderAcceptedEvent) => {
      setOrders((prev) => prev.filter((o) => o.orderId !== data.orderId))
      setTotal((prev) => Math.max(0, prev - 1))
    }

    const handleRemoved = (data: OrderRemovedEvent) => {
      setOrders((prev) => prev.filter((o) => o.orderId !== data.orderId))
      setTotal((prev) => Math.max(0, prev - 1))
    }

    socket.on('order:available', handleAvailable)
    socket.on('order:accepted', handleAccepted)
    socket.on('order:removed', handleRemoved)

    return () => {
      socket.off('order:available', handleAvailable)
      socket.off('order:accepted', handleAccepted)
      socket.off('order:removed', handleRemoved)
    }
  }, [socket, isDriver, page])

  const goToPage = useCallback((targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return
    fetchPage(targetPage)
  }, [totalPages, fetchPage])

  // Refresh current page (used when opening the panel)
  const refresh = useCallback(() => {
    fetchPage(page)
  }, [fetchPage, page])

  const acceptOrderAction = useCallback(
    async (orderId: string) => {
      if (acceptingOrderId) return

      try {
        setAcceptingOrderId(orderId)
        const result = await profileService.acceptOrder(orderId)

        setOrders((prev) => prev.filter((o) => o.orderId !== orderId))
        setTotal((prev) => Math.max(0, prev - 1))

        if (!result.success) {
          if (result.message === 'You already have an active order') {
            toast.warning(t('driver.orderQueue.alreadyHaveOrder'))
          } else {
            toast.warning(t('driver.orderQueue.alreadyTaken'))
          }
        } else {
          toast.success(t('driver.orderQueue.accepted'))
        }
      } catch {
        toast.error(t('driver.orderQueue.acceptError'))
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId))
        setTotal((prev) => Math.max(0, prev - 1))
      } finally {
        setAcceptingOrderId(null)
      }
    },
    [acceptingOrderId, toast, t]
  )

  const denyOrderAction = useCallback(
    async (orderId: string) => {
      try {
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId))
        setTotal((prev) => Math.max(0, prev - 1))
        await profileService.denyOrder(orderId)
      } catch {
        logger.error('Failed to deny order', undefined, { orderId })
      }
    },
    []
  )

  return {
    orders,
    orderCount: total,
    isLoading,
    acceptingOrderId,
    acceptOrder: acceptOrderAction,
    denyOrder: denyOrderAction,
    isDriver,
    isAvailable,
    // Pagination
    page,
    totalPages,
    total,
    goToPage,
    refresh,
  }
}
