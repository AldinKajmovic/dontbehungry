import api from './api'

export interface RegisterUserData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

export interface RegisterRestaurantData extends RegisterUserData {
  restaurantName: string
  restaurantDescription?: string
  restaurantPhone?: string
  restaurantEmail?: string
  address: string
  city: string
  country: string
  postalCode?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  avatarUrl?: string
}

export interface AuthResponse {
  message: string
  user: User
}

export interface ApiError {
  error: string
  details?: string
}

class AuthService {
  async register(data: RegisterUserData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data)
    return response.data
  }

  async registerRestaurant(data: RegisterRestaurantData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register-restaurant', data)
    return response.data
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data)
    return response.data
  }

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  }

  async logoutAll(): Promise<void> {
    await api.post('/api/auth/logout-all')
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/api/auth/me')
    return response.data
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/refresh')
    return response.data
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
    return response.data
  }

  async resendVerification(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/resend-verification')
    return response.data
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/forgot-password', { email })
    return response.data
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/reset-password', { token, password })
    return response.data
  }
}

export const authService = new AuthService()
