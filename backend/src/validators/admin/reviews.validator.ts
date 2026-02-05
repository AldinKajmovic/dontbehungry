// Review validation: filters, create, update
import { BadRequestError } from '../../utils/errors'
import { validateStringLength } from './shared'

export interface ReviewFilters {
  rating?: number
  restaurantId?: string
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

  // Security: Validate string lengths
  validateStringLength(data.title, 'title')
  validateStringLength(data.content, 'content')

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

  // Security: Validate string lengths
  validateStringLength(data.title, 'title')
  validateStringLength(data.content, 'content')

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    throw new BadRequestError('Invalid rating', 'Rating must be between 1 and 5')
  }
}
