// Shared validation utilities and types
import { BadRequestError } from '../../utils/errors'

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

function isAsciiLetterOrDigit(char: string): boolean {
  return (
    (char >= 'a' && char <= 'z') ||
    (char >= 'A' && char <= 'Z') ||
    (char >= '0' && char <= '9')
  )
}

function isAllowedLocalPartChar(char: string): boolean {
  return isAsciiLetterOrDigit(char) || ".!#$%&'*+/=?^_`{|}~-".includes(char)
}

export function isValidEmailAddress(value: string): boolean {
  if (value.length === 0 || value.length > MAX_STRING_LENGTHS.email) {
    return false
  }

  const atIndex = value.indexOf('@')
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@') || atIndex === value.length - 1) {
    return false
  }

  const localPart = value.slice(0, atIndex)
  const domain = value.slice(atIndex + 1)

  if (
    localPart.length === 0 ||
    localPart.length > 64 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return false
  }

  for (const char of localPart) {
    if (!isAllowedLocalPartChar(char)) {
      return false
    }
  }

  if (domain.length === 0 || domain.length > 253 || domain.includes('..')) {
    return false
  }

  const labels = domain.split('.')
  if (labels.length < 2) {
    return false
  }

  for (const label of labels) {
    if (label.length === 0 || label.length > 63) {
      return false
    }

    if (!isAsciiLetterOrDigit(label[0]) || !isAsciiLetterOrDigit(label[label.length - 1])) {
      return false
    }

    for (const char of label) {
      if (!isAsciiLetterOrDigit(char) && char !== '-') {
        return false
      }
    }
  }

  return true
}

export const EMAIL_REGEX = {
  test: isValidEmailAddress,
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
