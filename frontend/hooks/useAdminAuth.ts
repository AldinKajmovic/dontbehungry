'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import { adminService } from '@/services/admin'

interface UseAdminAuthReturn {
  isAuthorized: boolean
  isLoading: boolean
  error: string | null
  checkAccess: () => Promise<boolean>
}

export function useAdminAuth(): UseAdminAuthReturn {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAccess = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user) {
        setError('Authentication required')
        setIsAuthorized(false)
        return false
      }

      const allowedRoles = ['ADMIN']
      if (!allowedRoles.includes(user.role)) {
        setError('You do not have permission to access the admin panel')
        setIsAuthorized(false)
        return false
      }

      const response = await adminService.verifyAccess()
      if (response.authorized) {
        setIsAuthorized(true)
        return true
      }

      setError('Access denied')
      setIsAuthorized(false)
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify admin access'
      setError(message)
      setIsAuthorized(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setIsLoading(false)
      setIsAuthorized(false)
      router.push('/auth/login')
      return
    }

    const allowedRoles = ['ADMIN']
    if (!allowedRoles.includes(user.role)) {
      setIsLoading(false)
      setIsAuthorized(false)
      router.push('/')
      return
    }

    checkAccess()
  }, [user, authLoading, router, checkAccess])

  return {
    isAuthorized,
    isLoading: authLoading || isLoading,
    error,
    checkAccess,
  }
}
