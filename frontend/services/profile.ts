import api from './api'
import { User, AuthResponse } from './auth'

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

export interface UpdateProfileResponse {
  message: string
  user: User
  emailChanged?: boolean
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface UpdateAvatarData {
  avatarUrl: string | null
}

class ProfileService {
  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    const response = await api.patch<UpdateProfileResponse>('/api/profile', data)
    return response.data
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/profile/change-password', data)
    return response.data
  }

  async updateAvatar(data: UpdateAvatarData): Promise<AuthResponse> {
    const response = await api.patch<AuthResponse>('/api/profile/avatar', data)
    return response.data
  }

  async deleteAccount(): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/api/profile')
    return response.data
  }
}

export const profileService = new ProfileService()
