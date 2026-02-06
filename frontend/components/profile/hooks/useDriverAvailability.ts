'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { profileService } from '@/services/profile'
import { AvailabilityStatus, MonthlyHours } from '@/services/profile/types'
import { logger } from '@/utils/logger'

const LOCATION_UPDATE_INTERVAL = 60000 // 60 seconds

export function useDriverAvailability() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const isDriver = user?.role === 'DELIVERY_DRIVER'

  const [isOnline, setIsOnline] = useState(false)
  const [currentShift, setCurrentShift] = useState<AvailabilityStatus['currentShift']>(null)
  const [workedMinutes, setWorkedMinutes] = useState(0)
  const [monthlyHours, setMonthlyHours] = useState<MonthlyHours[]>([])
  const [totalHours, setTotalHours] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const locationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Fetch availability status
  const fetchStatus = useCallback(async () => {
    if (!isDriver) return

    try {
      setLoading(true)
      setError(null)
      const status = await profileService.getAvailabilityStatus()
      setIsOnline(status.isOnline)
      setCurrentShift(status.currentShift)
      if (status.currentShift) {
        setWorkedMinutes(status.currentShift.workedMinutes)
      }
    } catch (err) {
      setError(t('profile.availability.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [isDriver, t])

  // Fetch monthly hours
  const fetchMonthlyHours = useCallback(async () => {
    if (!isDriver) return

    try {
      const response = await profileService.getMonthlyHours(6)
      setMonthlyHours(response.months)
      setTotalHours(response.totalHours)
    } catch {
      // Silently fail for hours
    }
  }, [isDriver])

  // Toggle availability
  const toggle = useCallback(async () => {
    if (!isDriver || toggling) return

    try {
      setToggling(true)
      setError(null)
      const result = await profileService.toggleAvailability()
      setIsOnline(result.isOnline)
      setCurrentShift(result.currentShift)

      // Notify other hooks (e.g. order queue) about availability change
      window.dispatchEvent(
        new CustomEvent('driver:availability-changed', { detail: { isOnline: result.isOnline } })
      )

      if (result.currentShift) {
        setWorkedMinutes(result.currentShift.workedMinutes)
      } else {
        setWorkedMinutes(0)
        // Refresh monthly hours after going offline
        fetchMonthlyHours()
      }
    } catch (err) {
      setError(t('profile.availability.toggleError'))
    } finally {
      setToggling(false)
    }
  }, [isDriver, toggling, fetchMonthlyHours, t])

  // Initial fetch
  useEffect(() => {
    if (isDriver) {
      fetchStatus()
      fetchMonthlyHours()
    }
  }, [isDriver, fetchStatus, fetchMonthlyHours])

  // Timer to update worked minutes while online
  // Only counts from first order time, not shift start
  useEffect(() => {
    if (isOnline && currentShift) {
      // Update every minute
      timerRef.current = setInterval(() => {
        if (currentShift.firstOrderTime) {
          // Work started - count from first order
          const firstOrderTime = new Date(currentShift.firstOrderTime).getTime()
          const now = Date.now()
          const minutes = Math.round((now - firstOrderTime) / (1000 * 60))
          setWorkedMinutes(minutes)
        } else {
          // No orders yet - 0 worked minutes
          setWorkedMinutes(0)
        }
      }, 60000) // Update every minute

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [isOnline, currentShift])

  // Report location every 60 seconds when online
  const reportLocation = useCallback(async () => {
    if (!isOnline || !isDriver) return

    if (!navigator.geolocation) {
      setLocationError(t('profile.availability.locationNotSupported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationError(null)
          await profileService.updateMyLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading ?? undefined,
          })
        } catch (err) {
          logger.error('Failed to update location', err)
        }
      },
      (err) => {
        logger.error('Geolocation error', new Error(err.message), {
          code: err.code,
        })
        setLocationError(t('profile.availability.locationError'))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  }, [isOnline, isDriver, t])

  // Start location reporting when online
  useEffect(() => {
    if (isOnline && isDriver) {
      // Report immediately
      reportLocation()

      // Then report every 60 seconds
      locationTimerRef.current = setInterval(reportLocation, LOCATION_UPDATE_INTERVAL)

      return () => {
        if (locationTimerRef.current) {
          clearInterval(locationTimerRef.current)
        }
      }
    } else {
      // Clear any existing timer
      if (locationTimerRef.current) {
        clearInterval(locationTimerRef.current)
        locationTimerRef.current = null
      }
      setLocationError(null)
    }
  }, [isOnline, isDriver, reportLocation])

  // Format elapsed time as HH:MM
  const formatElapsedTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }, [])

  return {
    isDriver,
    isOnline,
    currentShift,
    workedMinutes,
    formattedElapsedTime: formatElapsedTime(workedMinutes),
    hasStartedWorking: currentShift?.firstOrderTime != null,
    monthlyHours,
    totalHours,
    loading,
    toggling,
    error,
    locationError,
    toggle,
    refresh: fetchStatus,
  }
}
