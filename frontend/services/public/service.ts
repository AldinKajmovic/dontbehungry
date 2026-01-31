import api from '../api'
import {
  Category,
  PublicRestaurant,
  MenuCategory,
  PaginatedResponse,
  RestaurantFilters,
} from './types'

export interface GetRestaurantsParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  categoryId?: string
  minRating?: number
}

class PublicService {
  async getRestaurants(params: GetRestaurantsParams = {}): Promise<PaginatedResponse<PublicRestaurant>> {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.set('page', params.page.toString())
    if (params.limit) queryParams.set('limit', params.limit.toString())
    if (params.search) queryParams.set('search', params.search)
    if (params.sortBy) queryParams.set('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder)
    if (params.categoryId) queryParams.set('categoryId', params.categoryId)
    if (params.minRating) queryParams.set('minRating', params.minRating.toString())

    const response = await api.get<PaginatedResponse<PublicRestaurant>>(
      `/api/public/restaurants?${queryParams.toString()}`
    )
    return response.data
  }

  async getRestaurantById(id: string): Promise<PublicRestaurant> {
    const response = await api.get<PublicRestaurant>(`/api/public/restaurants/${id}`)
    return response.data
  }

  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/api/public/categories')
    return response.data
  }

  async getRestaurantMenuItems(restaurantId: string, categoryId?: string): Promise<MenuCategory[]> {
    const queryParams = categoryId ? `?categoryId=${categoryId}` : ''
    const response = await api.get<MenuCategory[]>(
      `/api/public/restaurants/${restaurantId}/menu-items${queryParams}`
    )
    return response.data
  }
}

export const publicService = new PublicService()
