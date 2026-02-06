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
  OrderHistoryFilters,
  OrderHistoryResponse,
  RestaurantOrdersResponse,
  CreateOrderData,
  CreateOrderResponse,
  UpdateOrderStatusData,
  UpdateOrderStatusResponse,
  GetDeliveryInfoResponse,
  AvailabilityStatus,
  ToggleAvailabilityResponse,
  MonthlyHoursResponse,
  GetDriverLocationResponse,
  UpdateLocationData,
  AcceptOrderResponse,
  AvailableOrdersResponse,
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

  // Order History
  async getMyOrderHistory(filters: OrderHistoryFilters = {}): Promise<OrderHistoryResponse> {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.createdAtFrom) params.append('createdAtFrom', filters.createdAtFrom)
    if (filters.createdAtTo) params.append('createdAtTo', filters.createdAtTo)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = `${BASE_PATH}/my-orders${queryString ? `?${queryString}` : ''}`
    const response = await api.get<OrderHistoryResponse>(url)
    return response.data
  }

  async getDriverOrderHistory(filters: OrderHistoryFilters = {}): Promise<OrderHistoryResponse> {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.createdAtFrom) params.append('createdAtFrom', filters.createdAtFrom)
    if (filters.createdAtTo) params.append('createdAtTo', filters.createdAtTo)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = `${BASE_PATH}/driver-orders${queryString ? `?${queryString}` : ''}`
    const response = await api.get<OrderHistoryResponse>(url)
    return response.data
  }

  async getRestaurantOrders(
    restaurantId: string,
    filters: OrderHistoryFilters = {}
  ): Promise<RestaurantOrdersResponse> {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.createdAtFrom) params.append('createdAtFrom', filters.createdAtFrom)
    if (filters.createdAtTo) params.append('createdAtTo', filters.createdAtTo)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = `${BASE_PATH}/my-restaurants/${restaurantId}/orders${queryString ? `?${queryString}` : ''}`
    const response = await api.get<RestaurantOrdersResponse>(url)
    return response.data
  }

  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const response = await api.post<CreateOrderResponse>(`${BASE_PATH}/orders`, data)
    return response.data
  }

  async updateRestaurantOrderStatus(
    restaurantId: string,
    orderId: string,
    data: UpdateOrderStatusData
  ): Promise<UpdateOrderStatusResponse> {
    const response = await api.patch<UpdateOrderStatusResponse>(
      `${BASE_PATH}/my-restaurants/${restaurantId}/orders/${orderId}`,
      data
    )
    return response.data
  }

  async getDeliveryInfo(restaurantId: string, addressId: string): Promise<GetDeliveryInfoResponse> {
    const response = await api.get<GetDeliveryInfoResponse>(
      `${BASE_PATH}/delivery-info?restaurantId=${restaurantId}&addressId=${addressId}`
    )
    return response.data
  }

  // Driver Availability
  async toggleAvailability(): Promise<ToggleAvailabilityResponse> {
    const response = await api.post<ToggleAvailabilityResponse>(
      `${BASE_PATH}/availability/toggle`
    )
    return response.data
  }

  async getAvailabilityStatus(): Promise<AvailabilityStatus> {
    const response = await api.get<AvailabilityStatus>(
      `${BASE_PATH}/availability/status`
    )
    return response.data
  }

  async getMonthlyHours(months: number = 6): Promise<MonthlyHoursResponse> {
    const response = await api.get<MonthlyHoursResponse>(
      `${BASE_PATH}/availability/hours?months=${months}`
    )
    return response.data
  }

  async getDriverLocation(orderId: string): Promise<GetDriverLocationResponse> {
    const response = await api.get<GetDriverLocationResponse>(
      `${BASE_PATH}/orders/${orderId}/driver-location`
    )
    return response.data
  }

  async updateMyLocation(data: UpdateLocationData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `${BASE_PATH}/location`,
      data
    )
    return response.data
  }

  async getAvailableOrders(page = 1, limit = 10): Promise<AvailableOrdersResponse> {
    const response = await api.get<AvailableOrdersResponse>(
      `${BASE_PATH}/available-orders?page=${page}&limit=${limit}`
    )
    return response.data
  }

  async acceptOrder(orderId: string): Promise<AcceptOrderResponse> {
    const response = await api.post<AcceptOrderResponse>(
      `${BASE_PATH}/orders/${orderId}/accept`
    )
    return response.data
  }

  async denyOrder(orderId: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `${BASE_PATH}/orders/${orderId}/deny`
    )
    return response.data
  }
}

export const profileService = new ProfileService()
