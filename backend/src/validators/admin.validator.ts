import { BadRequestError } from '../utils/errors'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_LIMITS = [5, 10, 25, 100]

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserFilters {
  role?: string
  emailVerified?: boolean
}

export interface RestaurantFilters {
  ownerId?: string
  minRating?: number
  maxRating?: number
  minDeliveryFee?: number
  maxDeliveryFee?: number
  minOrderAmount?: number
  maxOrderAmount?: number
}

export interface OrderFilters {
  status?: string
  paymentStatus?: string
  restaurantId?: string
  customerId?: string
  driverId?: string
  minTotalAmount?: number
  maxTotalAmount?: number
  createdAtFrom?: Date
  createdAtTo?: Date
}

export interface MenuItemFilters {
  restaurantId?: string
  categoryId?: string
  isAvailable?: boolean
  minPrice?: number
  maxPrice?: number
  minPrepTime?: number
  maxPrepTime?: number
}

export interface ReviewFilters {
  rating?: number
  restaurantId?: string
}

export interface PlaceFilters {
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export function validatePagination(query: {
  page?: string
  limit?: string
  search?: string
  sortBy?: string
  sortOrder?: string
}): PaginationParams {
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '10', 10)

  if (isNaN(page) || page < 1) {
    throw new BadRequestError('Invalid page', 'Page must be a positive integer')
  }

  if (isNaN(limit) || !VALID_LIMITS.includes(limit)) {
    throw new BadRequestError('Invalid limit', `Limit must be one of: ${VALID_LIMITS.join(', ')}`)
  }

  const sortOrder = query.sortOrder === 'desc' ? 'desc' : query.sortOrder === 'asc' ? 'asc' : undefined

  return {
    page,
    limit,
    search: query.search?.trim() || undefined,
    sortBy: query.sortBy || undefined,
    sortOrder,
  }
}

export function validateUserFilters(query: {
  role?: string
  emailVerified?: string
}): UserFilters {
  const filters: UserFilters = {}

  const validRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'ADMIN', 'SUPER_ADMIN']
  if (query.role && validRoles.includes(query.role)) {
    filters.role = query.role
  }

  if (query.emailVerified === 'true') {
    filters.emailVerified = true
  } else if (query.emailVerified === 'false') {
    filters.emailVerified = false
  }

  return filters
}

export function validateRestaurantFilters(query: {
  ownerId?: string
  minRating?: string
  maxRating?: string
  minDeliveryFee?: string
  maxDeliveryFee?: string
  minOrderAmount?: string
  maxOrderAmount?: string
}): RestaurantFilters {
  const filters: RestaurantFilters = {}

  if (query.ownerId) {
    filters.ownerId = query.ownerId
  }

  if (query.minRating) {
    const val = parseFloat(query.minRating)
    if (!isNaN(val) && val >= 0 && val <= 5) filters.minRating = val
  }

  if (query.maxRating) {
    const val = parseFloat(query.maxRating)
    if (!isNaN(val) && val >= 0 && val <= 5) filters.maxRating = val
  }

  if (query.minDeliveryFee) {
    const val = parseFloat(query.minDeliveryFee)
    if (!isNaN(val) && val >= 0) filters.minDeliveryFee = val
  }

  if (query.maxDeliveryFee) {
    const val = parseFloat(query.maxDeliveryFee)
    if (!isNaN(val) && val >= 0) filters.maxDeliveryFee = val
  }

  if (query.minOrderAmount) {
    const val = parseFloat(query.minOrderAmount)
    if (!isNaN(val) && val >= 0) filters.minOrderAmount = val
  }

  if (query.maxOrderAmount) {
    const val = parseFloat(query.maxOrderAmount)
    if (!isNaN(val) && val >= 0) filters.maxOrderAmount = val
  }

  return filters
}

export function validateOrderFilters(query: {
  status?: string
  paymentStatus?: string
  restaurantId?: string
  customerId?: string
  driverId?: string
  minTotalAmount?: string
  maxTotalAmount?: string
  createdAtFrom?: string
  createdAtTo?: string
}): OrderFilters {
  const filters: OrderFilters = {}

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
  if (query.status && validStatuses.includes(query.status)) {
    filters.status = query.status
  }

  const validPaymentStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
  if (query.paymentStatus && validPaymentStatuses.includes(query.paymentStatus)) {
    filters.paymentStatus = query.paymentStatus
  }

  if (query.restaurantId) {
    filters.restaurantId = query.restaurantId
  }

  if (query.customerId) {
    filters.customerId = query.customerId
  }

  if (query.driverId) {
    filters.driverId = query.driverId
  }

  if (query.minTotalAmount) {
    const val = parseFloat(query.minTotalAmount)
    if (!isNaN(val) && val >= 0) filters.minTotalAmount = val
  }

  if (query.maxTotalAmount) {
    const val = parseFloat(query.maxTotalAmount)
    if (!isNaN(val) && val >= 0) filters.maxTotalAmount = val
  }

  if (query.createdAtFrom) {
    const date = new Date(query.createdAtFrom)
    if (!isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0)
      filters.createdAtFrom = date
    }
  }

  if (query.createdAtTo) {
    const date = new Date(query.createdAtTo)
    if (!isNaN(date.getTime())) {
      date.setHours(23, 59, 59, 999)
      filters.createdAtTo = date
    }
  }

  return filters
}

export function validateMenuItemFilters(query: {
  restaurantId?: string
  categoryId?: string
  isAvailable?: string
  minPrice?: string
  maxPrice?: string
  minPrepTime?: string
  maxPrepTime?: string
}): MenuItemFilters {
  const filters: MenuItemFilters = {}

  if (query.restaurantId) {
    filters.restaurantId = query.restaurantId
  }

  if (query.categoryId) {
    filters.categoryId = query.categoryId
  }

  if (query.isAvailable === 'true') {
    filters.isAvailable = true
  } else if (query.isAvailable === 'false') {
    filters.isAvailable = false
  }

  if (query.minPrice) {
    const val = parseFloat(query.minPrice)
    if (!isNaN(val) && val >= 0) filters.minPrice = val
  }

  if (query.maxPrice) {
    const val = parseFloat(query.maxPrice)
    if (!isNaN(val) && val >= 0) filters.maxPrice = val
  }

  if (query.minPrepTime) {
    const val = parseInt(query.minPrepTime, 10)
    if (!isNaN(val) && val >= 0) filters.minPrepTime = val
  }

  if (query.maxPrepTime) {
    const val = parseInt(query.maxPrepTime, 10)
    if (!isNaN(val) && val >= 0) filters.maxPrepTime = val
  }

  return filters
}

export function validatePlaceFilters(query: {
  city?: string
  state?: string
  country?: string
  postalCode?: string
}): PlaceFilters {
  const filters: PlaceFilters = {}

  if (query.city) {
    filters.city = query.city
  }

  if (query.state) {
    filters.state = query.state
  }

  if (query.country) {
    filters.country = query.country
  }

  if (query.postalCode) {
    filters.postalCode = query.postalCode
  }

  return filters
}

export function validateReviewFilters(query: {
  rating?: string
  restaurantId?: string
}): ReviewFilters {
  const filters: ReviewFilters = {}

  if (query.rating) {
    const rating = parseInt(query.rating, 10)
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      filters.rating = rating
    }
  }

  if (query.restaurantId) {
    filters.restaurantId = query.restaurantId
  }

  return filters
}

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
}

export function validateCreateUser(data: CreateUserData): void {
  const { email, password, firstName, lastName, role } = data

  if (!email || !password || !firstName || !lastName) {
    throw new BadRequestError('Missing required fields', 'Email, password, firstName, and lastName are required')
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid email address')
  }

  if (password.length < 8) {
    throw new BadRequestError('Password too short', 'Password must be at least 8 characters long')
  }

  const validRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'ADMIN']
  if (role && !validRoles.includes(role)) {
    throw new BadRequestError('Invalid role', `Role must be one of: ${validRoles.join(', ')}`)
  }
}

export interface UpdateUserData {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  emailVerified?: boolean
  phoneVerified?: boolean
}

export function validateUpdateUser(data: UpdateUserData): void {
  const { email, role } = data

  if (email && !EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid email address')
  }

  const validRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'ADMIN']
  if (role && !validRoles.includes(role)) {
    throw new BadRequestError('Invalid role', `Role must be one of: ${validRoles.join(', ')}`)
  }
}

export interface CreateRestaurantData {
  name: string
  description?: string
  phone?: string
  email?: string
  ownerId: string
  placeId: string
  minOrderAmount?: number
  deliveryFee?: number
}

export function validateCreateRestaurant(data: CreateRestaurantData): void {
  const { name, ownerId, placeId, email } = data

  if (!name || !ownerId || !placeId) {
    throw new BadRequestError('Missing required fields', 'Name, ownerId, and placeId are required')
  }

  if (email && !EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid restaurant email address')
  }
}

export interface UpdateRestaurantData {
  name?: string
  description?: string
  phone?: string
  email?: string
  ownerId?: string
  placeId?: string
  minOrderAmount?: number
  deliveryFee?: number
}

export function validateUpdateRestaurant(data: UpdateRestaurantData): void {
  const { email } = data

  if (email && !EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid restaurant email address')
  }
}

export interface CreateCategoryData {
  name: string
  description?: string
  iconUrl?: string
}

export function validateCreateCategory(data: CreateCategoryData): void {
  const { name } = data

  if (!name) {
    throw new BadRequestError('Missing required fields', 'Category name is required')
  }
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  iconUrl?: string
}


export interface CreateMenuItemData {
  name: string
  description?: string
  price: number
  imageUrl?: string
  restaurantId: string
  categoryId?: string
  isAvailable?: boolean
  preparationTime?: number
}

export function validateCreateMenuItem(data: CreateMenuItemData): void {
  const { name, price, restaurantId } = data

  if (!name || price === undefined || !restaurantId) {
    throw new BadRequestError('Missing required fields', 'Name, price, and restaurantId are required')
  }

  if (typeof price !== 'number' || price < 0) {
    throw new BadRequestError('Invalid price', 'Price must be a non-negative number')
  }
}

export interface UpdateMenuItemData {
  name?: string
  description?: string
  price?: number
  imageUrl?: string
  restaurantId?: string
  categoryId?: string
  isAvailable?: boolean
  preparationTime?: number
}

export function validateUpdateMenuItem(data: UpdateMenuItemData): void {
  const { price } = data

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    throw new BadRequestError('Invalid price', 'Price must be a non-negative number')
  }
}

export interface UpdateOrderData {
  status?: string
  driverId?: string
  notes?: string
  estimatedDelivery?: string
}

export function validateUpdateOrder(data: UpdateOrderData): void {
  const { status } = data

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status', `Status must be one of: ${validStatuses.join(', ')}`)
  }
}

export interface CreateOrderData {
  userId: string
  restaurantId: string
  deliveryPlaceId: string
  driverId?: string | null
  status?: string
  subtotal: number
  deliveryFee?: number
  tax?: number
  notes?: string | null
}

export function validateCreateOrder(data: CreateOrderData): void {
  const { userId, restaurantId, deliveryPlaceId, subtotal, status } = data

  if (!userId || !restaurantId || !deliveryPlaceId) {
    throw new BadRequestError('Missing required fields', 'userId, restaurantId, and deliveryPlaceId are required')
  }

  if (subtotal === undefined || typeof subtotal !== 'number' || subtotal < 0) {
    throw new BadRequestError('Invalid subtotal', 'Subtotal must be a non-negative number')
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status', `Status must be one of: ${validStatuses.join(', ')}`)
  }
}

export interface CreateReviewData {
  userId: string
  restaurantId: string
  rating: number
  title?: string
  content?: string
}

export function validateCreateReview(data: CreateReviewData): void {
  const { userId, restaurantId, rating } = data

  if (!userId || !restaurantId || rating === undefined) {
    throw new BadRequestError('Missing required fields', 'userId, restaurantId, and rating are required')
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new BadRequestError('Invalid rating', 'Rating must be between 1 and 5')
  }
}

export interface UpdateReviewData {
  rating?: number
  title?: string
  content?: string
}

export function validateUpdateReview(data: UpdateReviewData): void {
  const { rating } = data

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    throw new BadRequestError('Invalid rating', 'Rating must be between 1 and 5')
  }
}

export interface CreatePlaceData {
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
}

export function validateCreatePlace(data: CreatePlaceData): void {
  const { address, city, country } = data

  if (!address || !city || !country) {
    throw new BadRequestError('Missing required fields', 'Address, city, and country are required')
  }
}

export interface UpdatePlaceData {
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface UpdatePaymentData {
  status?: string
}

export function validateUpdatePayment(data: UpdatePaymentData): void {
  const { status } = data

  const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status', `Status must be one of: ${validStatuses.join(', ')}`)
  }
}
