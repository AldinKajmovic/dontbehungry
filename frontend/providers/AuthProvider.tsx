'use client'

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService, User, LoginData, RegisterUserData, RegisterRestaurantData } from '@/services/auth'
import { clearCsrfToken } from '@/services/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterUserData) => Promise<void>
  registerRestaurant: (data: RegisterRestaurantData) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshUser: () => Promise<void>
  resendVerification: () => Promise<void>
  updateUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

const PUBLIC_PATHS = [
  '/',
  '/restaurants',
  '/auth/login',
  '/auth/register',
  '/auth/register-restaurant',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/verification-sent',
  '/auth/callback',
]

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    path === '/' ? pathname === '/' : pathname?.startsWith(path)
  )

  const checkAuth = useCallback(async () => {

    try {
      const { user } = await authService.getCurrentUser()
      setUser(user)
    } catch {
      // User is not logged in - this is expected
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await authService.getCurrentUser()
      setUser(user)
    } catch {
      setUser(null)
    }
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  const login = useCallback(async (data: LoginData) => {
    const response = await authService.login(data)
    setUser(response.user)
    if (response.user.role === 'CUSTOMER') {
      router.push('/restaurants')
    } else {
      router.push('/my-profile')
    }
  }, [router])

  const register = useCallback(async (data: RegisterUserData) => {
    const response = await authService.register(data)
    setUser(response.user)
    if (response.user.role === 'CUSTOMER') {
      router.push('/restaurants')
    } else {
      router.push('/auth/verification-sent')
    }
  }, [router])

  const registerRestaurant = useCallback(async (data: RegisterRestaurantData) => {
    const response = await authService.registerRestaurant(data)
    setUser(response.user)
    // Show verification page after registration, but user can continue to app
    router.push('/auth/verification-sent')
  }, [router])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore errors on logout - just clear local state
    }
    clearCsrfToken()
    setUser(null)
    router.push('/auth/login')
  }, [router])

  const logoutAll = useCallback(async () => {
    try {
      await authService.logoutAll()
    } catch {
      // Ignore errors on logout - just clear local state
    }
    clearCsrfToken()
    setUser(null)
    router.push('/auth/login')
  }, [router])

  const resendVerification = useCallback(async () => {
    await authService.resendVerification()
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Listen for auth:logout event from api interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser((currentUser) => {
        if (currentUser) {

          const currentPath = window.location.pathname
          const isCurrentPathPublic = PUBLIC_PATHS.some((path) =>
            path === '/' ? currentPath === '/' : currentPath.startsWith(path)
          )
          if (!isCurrentPathPublic) {
            router.push('/auth/login')
          }
        }
        return null
      })
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [router])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    registerRestaurant,
    logout,
    logoutAll,
    refreshUser,
    resendVerification,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
