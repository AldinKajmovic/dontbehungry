// Auth service
import api from '../api'
import { MessageResponse } from '../base/types'
import {
  User,
  AuthResponse,
  RegisterUserData,
  RegisterRestaurantData,
  LoginData,
  GoogleAuthData,
} from './types'

const BASE_PATH = '/api/auth'

class AuthService {
  async register(data: RegisterUserData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${BASE_PATH}/register`, data)
    return response.data
  }

  async registerRestaurant(data: RegisterRestaurantData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${BASE_PATH}/register-restaurant`, data)
    return response.data
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${BASE_PATH}/login`, data)
    return response.data
  }

  async logout(): Promise<void> {
    await api.post(`${BASE_PATH}/logout`)
  }

  async logoutAll(): Promise<void> {
    await api.post(`${BASE_PATH}/logout-all`)
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>(`${BASE_PATH}/me`)
    return response.data
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${BASE_PATH}/refresh`)
    return response.data
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>(
      `${BASE_PATH}/verify-email?token=${encodeURIComponent(token)}`
    )
    return response.data
  }

  async resendVerification(): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(`${BASE_PATH}/resend-verification`)
    return response.data
  }

  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(`${BASE_PATH}/forgot-password`, { email })
    return response.data
  }

  async resetPassword(token: string, password: string): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(`${BASE_PATH}/reset-password`, {
      token,
      password,
    })
    return response.data
  }

  async googleAuth(data: GoogleAuthData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${BASE_PATH}/google`, data)
    return response.data
  }
}

export const authService = new AuthService()
