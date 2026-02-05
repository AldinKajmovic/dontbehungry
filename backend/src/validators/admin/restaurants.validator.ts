// Restaurant validation: filters, create, update
import { BadRequestError } from '../../utils/errors'
import { validateStringLength, EMAIL_REGEX } from './shared'

export interface RestaurantFilters {
  ownerId?: string
  minRating?: number
  maxRating?: number
  minDeliveryFee?: number
  maxDeliveryFee?: number
  minOrderAmount?: number
  maxOrderAmount?: number
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

  // Security: Validate string lengths
  validateStringLength(name, 'name')
  validateStringLength(data.description, 'description')
  validateStringLength(data.phone, 'phone')
  validateStringLength(email, 'email')

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

  // Security: Validate string lengths
  validateStringLength(data.name, 'name')
  validateStringLength(data.description, 'description')
  validateStringLength(data.phone, 'phone')
  validateStringLength(email, 'email')

  if (email && !EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid restaurant email address')
  }
}
