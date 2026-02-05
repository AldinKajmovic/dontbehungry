'use client'

import { useState, useEffect, useCallback } from 'react'
import { profileService, RestaurantOrderItem } from '@/services/profile'

export function useRestaurantOrders(restaurantId: string | null) {
  const [orders, setOrders] = useState<RestaurantOrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const loadOrders = useCallback(async (pageNum = 1) => {
    if (!restaurantId) return
    try {
      setLoading(true)
      setError('')
      const result = await profileService.getRestaurantOrders(restaurantId, {
        page: pageNum,
        limit: 5,
        status: status || undefined,
      })
      setOrders(result.orders)
      setPage(result.pagination.page)
      setTotalPages(result.pagination.totalPages)
      setTotal(result.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [restaurantId, status])

  // Load orders when status changes and modal is shown
  useEffect(() => {
    if (showModal && restaurantId) {
      loadOrders(1)
    }
  }, [status, showModal, restaurantId, loadOrders])

  const openModal = useCallback(() => {
    setShowModal(true)
    setStatus('')
    setPage(1)
    setError('')
    loadOrders(1)
  }, [loadOrders])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setOrders([])
    setPage(1)
    setStatus('')
    setError('')
  }, [])

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
  }, [])

  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    if (!restaurantId) return

    try {
      await profileService.updateRestaurantOrderStatus(restaurantId, orderId, {
        status: newStatus,
      })
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    }
  }, [restaurantId])

  const goToPage = useCallback((pageNum: number) => {
    loadOrders(pageNum)
  }, [loadOrders])

  return {
    orders,
    loading,
    showModal,
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
  }
}
