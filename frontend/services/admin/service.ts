// Admin service using base CRUD helpers
import api from '../api'
import { createCrudService, createSelectLoader, GetListParams } from '../base'
import { SelectOption, PaginatedResponse } from '../base/types'
import {
  AdminStats,
  AdminUser,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  UserAddress,
  CreateUserAddressInput,
  UpdateUserAddressInput,
  AdminRestaurant,
  CreateRestaurantInput,
  UpdateRestaurantInput,
  RestaurantFilters,
  AdminCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
  AdminMenuItem,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  MenuItemFilters,
  AdminOrder,
  AdminOrderItem,
  CreateOrderInput,
  UpdateOrderInput,
  CreateOrderItemInput,
  UpdateOrderItemInput,
  OrderFilters,
  AdminReview,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewFilters,
  AdminPlace,
  CreatePlaceInput,
  UpdatePlaceInput,
  PlaceFilters,
  AdminPayment,
  UpdatePaymentInput,
  SortParams,
  OnlineDriversResponse,
  BrowseImagesResponse,
  JobInfo,
  JobResult,
} from './types'

// API paths
const PATHS = {
  users: '/api/admin/users',
  restaurants: '/api/admin/restaurants',
  categories: '/api/admin/categories',
  menuItems: '/api/admin/menu-items',
  orders: '/api/admin/orders',
  reviews: '/api/admin/reviews',
  places: '/api/admin/places',
  payments: '/api/admin/payments',
} as const

// Create CRUD services for each resource
const usersCrud = createCrudService<AdminUser, CreateUserInput, UpdateUserInput>(PATHS.users)
const restaurantsCrud = createCrudService<AdminRestaurant, CreateRestaurantInput, UpdateRestaurantInput>(PATHS.restaurants)
const categoriesCrud = createCrudService<AdminCategory, CreateCategoryInput, UpdateCategoryInput>(PATHS.categories)
const menuItemsCrud = createCrudService<AdminMenuItem, CreateMenuItemInput, UpdateMenuItemInput>(PATHS.menuItems)
const ordersCrud = createCrudService<AdminOrder, never, UpdateOrderInput>(PATHS.orders)
const reviewsCrud = createCrudService<AdminReview, CreateReviewInput, UpdateReviewInput>(PATHS.reviews)
const placesCrud = createCrudService<AdminPlace, CreatePlaceInput, UpdatePlaceInput>(PATHS.places)
const paymentsCrud = createCrudService<AdminPayment, never, UpdatePaymentInput>(PATHS.payments)

// Select loaders for SearchableSelect component
const selectLoaders = {
  users: createSelectLoader<AdminUser>(
    usersCrud.getList,
    (user) => user.id,
    (user) => `${user.firstName} ${user.lastName}`
  ),
  restaurants: createSelectLoader<AdminRestaurant>(
    restaurantsCrud.getList,
    (r) => r.id,
    (r) => r.name
  ),
  categories: createSelectLoader<AdminCategory>(
    categoriesCrud.getList,
    (c) => c.id,
    (c) => c.name
  ),
  places: createSelectLoader<AdminPlace>(
    placesCrud.getList,
    (p) => p.id,
    (p) => `${p.address}, ${p.city}, ${p.country}`
  ),
}

class AdminService {
  // Verify admin access
  async verifyAccess(): Promise<{ message: string; authorized: boolean }> {
    const response = await api.get<{ message: string; authorized: boolean }>('/api/admin/verify-access')
    return response.data
  }

  // Get dashboard stats
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/api/admin/stats')
    return response.data
  }

  // ============ Users ============
  getUsers = (page?: number, limit?: number, search?: string, filters?: UserFilters, sort?: SortParams) =>
    usersCrud.getList({ page, limit, search, filters, ...sort })
  getUserById = usersCrud.getById
  createUser = usersCrud.create
  updateUser = usersCrud.update
  deleteUser = usersCrud.delete

  // ============ User Addresses ============
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    const res = await api.get<UserAddress[]>(`${PATHS.users}/${userId}/addresses`)
    return res.data
  }

  async addUserAddress(userId: string, data: CreateUserAddressInput): Promise<UserAddress> {
    const res = await api.post<UserAddress>(`${PATHS.users}/${userId}/addresses`, data)
    return res.data
  }

  async updateUserAddress(userId: string, addressId: string, data: UpdateUserAddressInput): Promise<UserAddress> {
    const res = await api.patch<UserAddress>(`${PATHS.users}/${userId}/addresses/${addressId}`, data)
    return res.data
  }

  async deleteUserAddress(userId: string, addressId: string): Promise<void> {
    await api.delete(`${PATHS.users}/${userId}/addresses/${addressId}`)
  }

  // ============ Restaurants ============
  getRestaurants = (page?: number, limit?: number, search?: string, filters?: RestaurantFilters, sort?: SortParams) =>
    restaurantsCrud.getList({ page, limit, search, filters, ...sort })
  getRestaurantById = restaurantsCrud.getById
  createRestaurant = restaurantsCrud.create
  updateRestaurant = restaurantsCrud.update
  deleteRestaurant = restaurantsCrud.delete

  // ============ Categories ============
  getCategories = (page?: number, limit?: number, search?: string, sort?: SortParams) =>
    categoriesCrud.getList({ page, limit, search, ...sort })
  getCategoryById = categoriesCrud.getById
  createCategory = categoriesCrud.create
  updateCategory = categoriesCrud.update
  deleteCategory = categoriesCrud.delete

  // ============ Menu Items ============
  getMenuItems = (page?: number, limit?: number, search?: string, filters?: MenuItemFilters, sort?: SortParams) =>
    menuItemsCrud.getList({ page, limit, search, filters, ...sort })
  getMenuItemById = menuItemsCrud.getById
  createMenuItem = menuItemsCrud.create
  updateMenuItem = menuItemsCrud.update
  deleteMenuItem = menuItemsCrud.delete

  // ============ Orders ============
  getOrders = (page?: number, limit?: number, search?: string, filters?: OrderFilters, sort?: SortParams) =>
    ordersCrud.getList({ page, limit, search, filters, ...sort })
  getOrderById = ordersCrud.getById
  createOrder = async (data: CreateOrderInput): Promise<AdminOrder> => {
    const res = await api.post<AdminOrder>(PATHS.orders, data)
    return res.data
  }
  updateOrder = ordersCrud.update
  deleteOrder = ordersCrud.delete

  // ============ Order Items ============
  async getOrderItems(orderId: string): Promise<AdminOrderItem[]> {
    const res = await api.get<AdminOrderItem[]>(`${PATHS.orders}/${orderId}/items`)
    return res.data
  }

  async addOrderItem(orderId: string, data: CreateOrderItemInput): Promise<AdminOrderItem> {
    const res = await api.post<AdminOrderItem>(`${PATHS.orders}/${orderId}/items`, data)
    return res.data
  }

  async updateOrderItem(orderId: string, itemId: string, data: UpdateOrderItemInput): Promise<AdminOrderItem> {
    const res = await api.patch<AdminOrderItem>(`${PATHS.orders}/${orderId}/items/${itemId}`, data)
    return res.data
  }

  async deleteOrderItem(orderId: string, itemId: string): Promise<void> {
    await api.delete(`${PATHS.orders}/${orderId}/items/${itemId}`)
  }

  // ============ Reviews ============
  getReviews = (page?: number, limit?: number, search?: string, filters?: ReviewFilters, sort?: SortParams) =>
    reviewsCrud.getList({ page, limit, search, filters, ...sort })
  getReviewById = reviewsCrud.getById
  createReview = reviewsCrud.create
  updateReview = reviewsCrud.update
  deleteReview = reviewsCrud.delete

  // ============ Places ============
  getPlaces = (page?: number, limit?: number, search?: string, filters?: PlaceFilters, sort?: SortParams) =>
    placesCrud.getList({ page, limit, search, filters, ...sort })
  getPlaceById = placesCrud.getById
  createPlace = placesCrud.create
  updatePlace = placesCrud.update
  deletePlace = placesCrud.delete

  // ============ Payments ============
  getPayments = (page?: number, limit?: number, search?: string, sort?: SortParams) =>
    paymentsCrud.getList({ page, limit, search, ...sort })
  getPaymentById = paymentsCrud.getById
  updatePayment = paymentsCrud.update

  // ============ Select Loaders ============
  // These return functions that can be passed to SearchableSelect
  getUsersForSelect = selectLoaders.users
  getRestaurantsForSelect = selectLoaders.restaurants
  getCategoriesForSelect = selectLoaders.categories
  getPlacesForSelect = selectLoaders.places

  // Special case: Drivers (filtered users)
  async getDriversForSelect(search?: string): Promise<SelectOption[]> {
    const response = await this.getUsers(1, 25, search, { role: 'DRIVER' })
    return response.items.map((user) => ({
      value: user.id,
      label: `${user.firstName} ${user.lastName}`,
    }))
  }

  // Special case: Menu items filtered by restaurant
  async getMenuItemsForSelect(restaurantId: string, search?: string): Promise<SelectOption[]> {
    const response = await this.getMenuItems(1, 25, search, { restaurantId })
    return response.items.map((item) => ({
      value: item.id,
      label: `${item.name} ($${parseFloat(item.price).toFixed(2)})`,
    }))
  }

  // ============ Online Drivers ============
  async getOnlineDrivers(): Promise<OnlineDriversResponse> {
    const response = await api.get<OnlineDriversResponse>('/api/admin/drivers/online')
    return response.data
  }

  // ============ Image Browser ============
  async browseImages(folder?: string): Promise<BrowseImagesResponse> {
    const params = folder ? { folder } : {}
    const response = await api.get<BrowseImagesResponse>('/api/admin/images/browse', { params })
    return response.data
  }

  // ============ Jobs ============
  async getJobs(): Promise<JobInfo[]> {
    const response = await api.get<{ jobs: JobInfo[] }>('/api/admin/jobs')
    return response.data.jobs
  }

  async executeJob(jobName: string): Promise<JobResult> {
    const response = await api.post<JobResult>(`/api/admin/jobs/${encodeURIComponent(jobName)}/execute`)
    return response.data
  }
}

export const adminService = new AdminService()
