// Menu item validation: filters, create, update
import { BadRequestError } from '../../utils/errors'
import { validateStringLength } from './shared'

export interface MenuItemFilters {
  restaurantId?: string
  categoryId?: string
  isAvailable?: boolean
  minPrice?: number
  maxPrice?: number
  minPrepTime?: number
  maxPrepTime?: number
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

  // Security: Validate string lengths
  validateStringLength(name, 'name')
  validateStringLength(data.description, 'description')

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

  // Security: Validate string lengths
  validateStringLength(data.name, 'name')
  validateStringLength(data.description, 'description')

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    throw new BadRequestError('Invalid price', 'Price must be a non-negative number')
  }
}
