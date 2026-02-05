// Place validation: filters, create, update
import { BadRequestError } from '../../utils/errors'
import { validateStringLength } from './shared'

export interface PlaceFilters {
  city?: string
  state?: string
  country?: string
  postalCode?: string
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

  // Security: Validate string lengths
  validateStringLength(address, 'address')
  validateStringLength(city, 'city')
  validateStringLength(data.state, 'state')
  validateStringLength(country, 'country')
  validateStringLength(data.postalCode, 'postalCode')
}

export interface UpdatePlaceData {
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}
