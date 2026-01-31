// Validation helper functions
import { z } from 'zod'
import {
  isValidPhoneNumber,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  CountryCode,
} from 'libphonenumber-js'

/**
 * Validate a phone number for a specific country
 */
export function validatePhone(phone: string, countryCode: CountryCode): boolean {
  if (!phone) return true
  const fullNumber = `+${getCountryCallingCode(countryCode)}${phone.replace(/\D/g, '')}`
  return isValidPhoneNumber(fullNumber, countryCode)
}

/**
 * Format a phone number to E.164 format
 */
export function formatPhoneE164(phone: string, countryCode: CountryCode): string | undefined {
  if (!phone) return undefined
  const fullNumber = `+${getCountryCallingCode(countryCode)}${phone.replace(/\D/g, '')}`
  const parsed = parsePhoneNumberFromString(fullNumber, countryCode)
  return parsed?.format('E.164')
}

/**
 * Validate a single field value
 */
export function validateFieldValue(
  fieldName: string,
  value: string,
  options?: {
    password?: string
    phoneCountry?: CountryCode
  }
): string | undefined {
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
      if (!value) return 'This field is required'
      if (value.length > 50) return 'Too long'
      break
    case 'email':
    case 'restaurantEmail':
      if (fieldName === 'email' && !value) return 'Email is required'
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return 'Please enter a valid email address'
      break
    case 'phone':
    case 'restaurantPhone':
      if (value && options?.phoneCountry && !validatePhone(value, options.phoneCountry)) {
        return 'Please enter a valid phone number'
      }
      break
    case 'password':
      if (!value) return 'Password is required'
      break
    case 'confirmPassword':
      if (!value) return 'Please confirm your password'
      if (value !== options?.password) return 'Passwords do not match'
      break
    case 'restaurantName':
      if (!value) return 'Restaurant name is required'
      if (value.length > 100) return 'Restaurant name is too long'
      break
    case 'address':
      if (!value) return 'Address is required'
      break
    case 'city':
      if (!value) return 'City is required'
      break
    case 'country':
      if (!value) return 'Country is required'
      break
  }
  return undefined
}

/**
 * Extract errors from Zod validation result
 */
export function extractZodErrors<T extends Record<string, unknown>>(result: {
  success: false
  error: z.ZodError
}): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {}
  result.error.issues.forEach((err) => {
    const field = err.path[0] as keyof T
    if (!errors[field]) {
      errors[field] = err.message
    }
  })
  return errors
}
