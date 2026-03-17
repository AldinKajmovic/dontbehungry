// User validation: filters, create, update
import { BadRequestError } from '../../utils/errors'
import { validateStringLength, isValidEmailAddress } from './shared'

export interface UserFilters {
  role?: string
  emailVerified?: boolean
}

export function validateUserFilters(query: {
  role?: string
  emailVerified?: string
}): UserFilters {
  const filters: UserFilters = {}

  const validRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'ADMIN']
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

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role?: string
}

export function validateCreateUser(data: CreateUserData): void {
  const { email, password, firstName, lastName, phone, role } = data

  if (!email || !password || !firstName || !lastName || !phone) {
    throw new BadRequestError('Missing required fields', 'Email, password, firstName, lastName, and phone are required')
  }

  // Security: Validate string lengths
  validateStringLength(email, 'email')
  validateStringLength(firstName, 'firstName')
  validateStringLength(lastName, 'lastName')
  validateStringLength(data.phone, 'phone')

  if (!isValidEmailAddress(email)) {
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
}

export function validateUpdateUser(data: UpdateUserData): void {
  const { email, role } = data

  // Security: Validate string lengths
  validateStringLength(email, 'email')
  validateStringLength(data.firstName, 'firstName')
  validateStringLength(data.lastName, 'lastName')
  validateStringLength(data.phone, 'phone')

  if (email && !isValidEmailAddress(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid email address')
  }

  const validRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'ADMIN']
  if (role && !validRoles.includes(role)) {
    throw new BadRequestError('Invalid role', `Role must be one of: ${validRoles.join(', ')}`)
  }
}
