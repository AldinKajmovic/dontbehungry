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

export interface OpeningHoursInput {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

export interface GalleryImageInput {
  imageUrl: string
  sortOrder: number
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
  logoUrl?: string | null
  coverUrl?: string | null
  openingHours?: OpeningHoursInput[]
  galleryImages?: GalleryImageInput[]
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

function validateOpeningHours(hours?: OpeningHoursInput[]): void {
  if (!hours) return
  if (hours.length > 7) {
    throw new BadRequestError('Too many opening hours entries', 'Maximum 7 entries allowed (one per day)')
  }
  const seen = new Set<number>()
  for (const entry of hours) {
    if (entry.dayOfWeek < 0 || entry.dayOfWeek > 6 || !Number.isInteger(entry.dayOfWeek)) {
      throw new BadRequestError('Invalid day of week', 'dayOfWeek must be an integer between 0 and 6')
    }
    if (seen.has(entry.dayOfWeek)) {
      throw new BadRequestError('Duplicate day', `Duplicate entry for day ${entry.dayOfWeek}`)
    }
    seen.add(entry.dayOfWeek)
    if (!entry.isClosed) {
      if (!TIME_REGEX.test(entry.openTime)) {
        throw new BadRequestError('Invalid open time', 'openTime must be in HH:mm format')
      }
      if (!TIME_REGEX.test(entry.closeTime)) {
        throw new BadRequestError('Invalid close time', 'closeTime must be in HH:mm format')
      }
    }
  }
}

function validateGalleryImages(images?: GalleryImageInput[]): void {
  if (!images) return
  if (images.length > 6) {
    throw new BadRequestError('Too many gallery images', 'Maximum 6 gallery images allowed')
  }
  for (const img of images) {
    if (!img.imageUrl || typeof img.imageUrl !== 'string') {
      throw new BadRequestError('Invalid gallery image', 'Each gallery image must have a valid imageUrl')
    }
  }
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

  validateOpeningHours(data.openingHours)
  validateGalleryImages(data.galleryImages)
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
  logoUrl?: string | null
  coverUrl?: string | null
  openingHours?: OpeningHoursInput[]
  galleryImages?: GalleryImageInput[]
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

  validateOpeningHours(data.openingHours)
  validateGalleryImages(data.galleryImages)
}
