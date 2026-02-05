// Shared validation utilities and types
import { BadRequestError } from '../../utils/errors'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const VALID_LIMITS = [5, 10, 25, 100]

// Security: Maximum string lengths to prevent DoS and database issues
export const MAX_STRING_LENGTHS: Record<string, number> = {
  name: 100,
  firstName: 50,
  lastName: 50,
  email: 255,
  phone: 20,
  address: 500,
  city: 100,
  state: 100,
  country: 100,
  postalCode: 20,
  description: 2000,
  title: 200,
  content: 5000,
  notes: 1000,
  default: 255,
}

export function validateStringLength(value: string | undefined, field: string, maxLength?: number): void {
  if (!value) return
  const max = maxLength || MAX_STRING_LENGTHS[field] || MAX_STRING_LENGTHS.default
  if (value.length > max) {
    throw new BadRequestError(`${field} too long`, `${field} must be at most ${max} characters`)
  }
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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
