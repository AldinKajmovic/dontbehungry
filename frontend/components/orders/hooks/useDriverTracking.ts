'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '@/providers/SocketProvider'
import { profileService } from '@/services/profile'
import { DriverLocationResponse, LocationUpdateEvent } from '@/services/profile/types'
import { logger } from '@/utils/logger'

const STALE_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

interface UseDriverTrackingProps {
  orderId: string
  enabled?: boolean
}

interface UseDriverTrackingResult {
  location: DriverLocationResponse | null
  loading: boolean
  error: string | null
  isStale: boolean
  refresh: () => Promise<void>
}

export function useDriverTracking({
  orderId,
  enabled = true,
}: UseDriverTrackingProps): UseDriverTrackingResult {
  const { socket, isConnected } = useSocket()
  const [location, setLocation] = useState<DriverLocationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  const staleCheckRef = useRef<NodeJS.Timeout | null>(null)

  // Check if location is stale
  const checkStale = useCallback(() => {
    if (!location) return

    const updatedAt = new Date(location.updatedAt).getTime()
    const now = Date.now()
    const isLocationStale = now - updatedAt > STALE_THRESHOLD_MS
    setIsStale(isLocationStale)
  }, [location])

  // Fetch initial location
  const fetchLocation = useCallback(async () => {
    if (!orderId || !enabled) return

    try {
      setError(null)
      const response = await profileService.getDriverLocation(orderId)
      setLocation(response.location)

      if (response.location) {
        const updatedAt = new Date(response.location.updatedAt).getTime()
        const now = Date.now()
        setIsStale(now - updatedAt > STALE_THRESHOLD_MS)
      }
    } catch (err) {
      logger.error('Failed to fetch driver location', err)
      setError('Failed to load driver location')
    } finally {
      setLoading(false)
    }
  }, [orderId, enabled])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchLocation()
    }
  }, [enabled, fetchLocation])

  // Subscribe to socket events
  useEffect(() => {
    if (!socket || !isConnected || !enabled) return

    const handleLocationUpdate = (event: LocationUpdateEvent) => {
      // Only update if this is for our order
      if (event.orderId !== orderId) return

      setLocation({
        driverId: event.driverId,
        driverName: event.driverName,
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        heading: event.location.heading,
        updatedAt: event.timestamp,
        isStale: false,
      })
      setIsStale(false)
    }

    socket.on('driver:location:update', handleLocationUpdate)

    return () => {
      socket.off('driver:location:update', handleLocationUpdate)
    }
  }, [socket, isConnected, orderId, enabled])

  // Periodic stale check
  useEffect(() => {
    if (!enabled || !location) return

    // Check every 30 seconds
    staleCheckRef.current = setInterval(checkStale, 30000)

    return () => {
      if (staleCheckRef.current) {
        clearInterval(staleCheckRef.current)
      }
    }
  }, [enabled, location, checkStale])

  return {
    location,
    loading,
    error,
    isStale,
    refresh: fetchLocation,
  }
}
