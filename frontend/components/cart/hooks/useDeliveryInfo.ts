'use client'

import { useState, useEffect, useCallback } from 'react'
import { profileService, DeliveryInfo } from '@/services/profile'
import { logger } from '@/utils/logger'

interface UseDeliveryInfoResult {
  deliveryInfo: DeliveryInfo | null
  isLoading: boolean
  error: string | null
  fallbackFee: number
  usedFallback: boolean
  refetch: () => Promise<void>
}

export function useDeliveryInfo(
  restaurantId: string | null,
  addressId: string | null,
  defaultFee: number = 5
): UseDeliveryInfoResult {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackFee, setFallbackFee] = useState(defaultFee)
  const [usedFallback, setUsedFallback] = useState(true)

  const fetchDeliveryInfo = useCallback(async () => {
    if (!restaurantId || !addressId) {
      setDeliveryInfo(null)
      setUsedFallback(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await profileService.getDeliveryInfo(restaurantId, addressId)

      if (response.success) {
        setDeliveryInfo(response.deliveryInfo)
        setUsedFallback(false)
        setFallbackFee(response.deliveryInfo.totalFee)
      } else {
        setDeliveryInfo(null)
        setFallbackFee(response.fallbackFee)
        setUsedFallback(true)
      }
    } catch (err) {
      logger.error('Failed to fetch delivery info', err)
      setError('Could not calculate delivery fee')
      setUsedFallback(true)
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, addressId])

  useEffect(() => {
    fetchDeliveryInfo()
  }, [fetchDeliveryInfo])

  return {
    deliveryInfo,
    isLoading,
    error,
    fallbackFee,
    usedFallback,
    refetch: fetchDeliveryInfo,
  }
}
