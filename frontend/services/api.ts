import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const CSRF_HEADER_NAME = 'X-CSRF-Token'
const SAFE_METHODS = new Set(['get', 'head', 'options'])

let isRefreshing = false
let refreshSubscribers: ((success: boolean) => void)[] = []
let csrfTokenRequest: Promise<string | null> | null = null
let cachedCsrfToken: string | null = null

export function clearCsrfToken(): void {
  cachedCsrfToken = null
}

function subscribeToRefresh(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback)
}

function notifySubscribers(success: boolean) {
  refreshSubscribers.forEach((callback) => callback(success))
  refreshSubscribers = []
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
})

async function ensureCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) {
    return cachedCsrfToken
  }

  if (!csrfTokenRequest) {
    csrfTokenRequest = axios.get<{ csrfToken: string }>(`${API_URL}/api/auth/csrf-token`, {
      withCredentials: true,
    })
      .then((response) => {
        cachedCsrfToken = response.data.csrfToken || null
        return cachedCsrfToken
      })
      .finally(() => {
        csrfTokenRequest = null
      })
  }

  return csrfTokenRequest
}

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toLowerCase()

    if (method && !SAFE_METHODS.has(method)) {
      const csrfToken = await ensureCsrfToken()

      if (csrfToken) {
        config.headers.set(CSRF_HEADER_NAME, csrfToken)
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Helper to extract user-friendly error message
function extractErrorMessage(error: AxiosError<{ error?: string; details?: string }>): string {
  return (
    error.response?.data?.details ||
    error.response?.data?.error ||
    error.message ||
    'An unexpected error occurred'
  )
}

// Response interceptor - handle errors and auto-refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ error?: string; details?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry for auth endpoints that would cause infinite loops
      const isAuthEndpoint = originalRequest.url?.includes('/api/auth/refresh') ||
                            originalRequest.url?.includes('/api/auth/login') ||
                            originalRequest.url?.includes('/api/auth/register')

      if (isAuthEndpoint) {
        return Promise.reject(new Error(extractErrorMessage(error)))
      }
      // Don't retry for silent endpoints
      const isSilentEndpoint = originalRequest.url?.includes('/api/auth/socket-token') ||
                               originalRequest.url?.includes('/api/auth/me')
      if (isSilentEndpoint) {
        return Promise.reject(new Error('Not authenticated'))
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh((success) => {
            if (success) {
              resolve(api(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/api/auth/refresh')
        isRefreshing = false
        notifySubscribers(true)

        // Retry the original request
        return api(originalRequest)
      } catch {
        isRefreshing = false
        notifySubscribers(false)

        // Refresh failed - clear CSRF token and dispatch event for AuthProvider
        cachedCsrfToken = null
        if (typeof window !== 'undefined') {
          const isAuthPage = window.location.pathname.startsWith('/auth/')
          if (!isAuthPage) {
            window.dispatchEvent(new CustomEvent('auth:logout'))
          }
        }

        return Promise.reject(error)
      }
    }

    return Promise.reject(new Error(extractErrorMessage(error)))
  }
)

export default api
