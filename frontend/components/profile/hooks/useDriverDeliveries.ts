'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { profileService, OrderHistoryItem } from '@/services/profile'

export function useDriverDeliveries() {
  const { user } = useAuth()
  const isDriver = user?.role === 'DELIVERY_DRIVER'

  const [deliveries, setDeliveries] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')

  const loadDeliveries = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true)
      const result = await profileService.getDriverOrderHistory({
        page: pageNum,
        limit: 5,
        status: status || undefined,
      })
      setDeliveries(result.orders)
      setPage(result.pagination.page)
      setTotalPages(result.pagination.totalPages)
      setTotal(result.pagination.total)
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
  }, [status])

  // Load deliveries when status changes and section is shown
  useEffect(() => {
    if (show && isDriver) {
      loadDeliveries(1)
    }
  }, [status, show, isDriver, loadDeliveries])

  const toggleShow = useCallback(() => {
    setShow((prev) => {
      const newShow = !prev
      if (newShow && deliveries.length === 0) {
        loadDeliveries(1)
      }
      return newShow
    })
  }, [deliveries.length, loadDeliveries])

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
  }, [])

  const goToPage = useCallback((pageNum: number) => {
    loadDeliveries(pageNum)
  }, [loadDeliveries])

  return {
    deliveries,
    loading,
    show,
    isDriver,
    page,
    totalPages,
    total,
    status,
    toggleShow,
    handleStatusChange,
    goToPage,
  }
}
