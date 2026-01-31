// Profile service
import api from '../api'
import { MessageResponse } from '../base/types'
import { AuthResponse } from '../auth/types'
import {
  UpdateProfileData,
  UpdateProfileResponse,
  ChangePasswordData,
  UpdateAvatarData,
  MyRestaurant,
  CreateMyRestaurantData,
  UpdateMyRestaurantData,
  MyMenuItem,
  CreateMyMenuItemData,
  UpdateMyMenuItemData,
  Category,
} from './types'

const BASE_PATH = '/api/profile'

class ProfileService {
  // Profile management
  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    const response = await api.patch<UpdateProfileResponse>(BASE_PATH, data)
    return response.data
  }

  async changePassword(data: ChangePasswordData): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(`${BASE_PATH}/change-password`, data)
    return response.data
  }

  async updateAvatar(data: UpdateAvatarData): Promise<AuthResponse> {
    const response = await api.patch<AuthResponse>(`${BASE_PATH}/avatar`, data)
    return response.data
  }

  async deleteAccount(): Promise<MessageResponse> {
    const response = await api.delete<MessageResponse>(BASE_PATH)
    return response.data
  }

  // Restaurant owner endpoints
  async getMyRestaurants(): Promise<{ restaurants: MyRestaurant[] }> {
    const response = await api.get<{ restaurants: MyRestaurant[] }>(`${BASE_PATH}/my-restaurants`)
    return response.data
  }

  async createMyRestaurant(
    data: CreateMyRestaurantData
  ): Promise<{ message: string; restaurant: MyRestaurant }> {
    const response = await api.post<{ message: string; restaurant: MyRestaurant }>(
      `${BASE_PATH}/my-restaurants`,
      data
    )
    return response.data
  }

  async updateMyRestaurant(
    id: string,
    data: UpdateMyRestaurantData
  ): Promise<{ message: string; restaurant: MyRestaurant }> {
    const response = await api.patch<{ message: string; restaurant: MyRestaurant }>(
      `${BASE_PATH}/my-restaurants/${id}`,
      data
    )
    return response.data
  }

  async deleteMyRestaurant(id: string): Promise<MessageResponse> {
    const response = await api.delete<MessageResponse>(`${BASE_PATH}/my-restaurants/${id}`)
    return response.data
  }

  // Menu items for restaurant owners
  async getMyMenuItems(restaurantId: string): Promise<{ items: MyMenuItem[] }> {
    const response = await api.get<{ items: MyMenuItem[] }>(
      `${BASE_PATH}/my-restaurants/${restaurantId}/menu-items`
    )
    return response.data
  }

  async createMyMenuItem(
    restaurantId: string,
    data: CreateMyMenuItemData
  ): Promise<{ message: string; item: MyMenuItem }> {
    const response = await api.post<{ message: string; item: MyMenuItem }>(
      `${BASE_PATH}/my-restaurants/${restaurantId}/menu-items`,
      data
    )
    return response.data
  }

  async updateMyMenuItem(
    restaurantId: string,
    itemId: string,
    data: UpdateMyMenuItemData
  ): Promise<{ message: string; item: MyMenuItem }> {
    const response = await api.patch<{ message: string; item: MyMenuItem }>(
      `${BASE_PATH}/my-restaurants/${restaurantId}/menu-items/${itemId}`,
      data
    )
    return response.data
  }

  async deleteMyMenuItem(restaurantId: string, itemId: string): Promise<MessageResponse> {
    const response = await api.delete<MessageResponse>(
      `${BASE_PATH}/my-restaurants/${restaurantId}/menu-items/${itemId}`
    )
    return response.data
  }

  // Categories
  async getCategories(): Promise<{ categories: Category[] }> {
    const response = await api.get<{ categories: Category[] }>(`${BASE_PATH}/categories`)
    return response.data
  }
}

export const profileService = new ProfileService()
