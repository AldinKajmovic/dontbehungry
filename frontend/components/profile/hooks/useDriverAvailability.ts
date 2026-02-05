'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { profileService } from '@/services/profile'
import { AvailabilityStatus, MonthlyHours } from '@/services/profile/types'

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

  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
    toggle,
    refresh: fetchStatus,
  }
}
