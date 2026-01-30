import sanitizeHtml from 'sanitize-html'

/**
 * Strict sanitization options for plain text fields
 * Strips ALL HTML tags and attributes
 */
const strictOptions: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard'
}

/**
 * Sanitize string input to prevent XSS attacks
 * Uses sanitize-html library to strip all HTML tags and trim whitespace
 */
export function sanitizeString(input: string | undefined | null): string | null {
  if (input === undefined || input === null) {
    return null
  }

  return sanitizeHtml(input.trim(), strictOptions)
}

export interface SanitizedAddressData {
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  notes?: string
  isDefault?: boolean
}

/**
 * Sanitize address data object
 */
export function sanitizeAddressData(data: Record<string, unknown>): SanitizedAddressData {
  const sanitized: SanitizedAddressData = {}

  if (typeof data.address === 'string') {
    sanitized.address = sanitizeString(data.address) || undefined
  }
  if (typeof data.city === 'string') {
    sanitized.city = sanitizeString(data.city) || undefined
  }
  if (typeof data.state === 'string') {
    sanitized.state = sanitizeString(data.state) || undefined
  }
  if (typeof data.country === 'string') {
    sanitized.country = sanitizeString(data.country) || undefined
  }
  if (typeof data.postalCode === 'string') {
    sanitized.postalCode = sanitizeString(data.postalCode) || undefined
  }
  if (typeof data.notes === 'string') {
    sanitized.notes = sanitizeString(data.notes) || undefined
  }
  if (typeof data.isDefault === 'boolean') {
    sanitized.isDefault = data.isDefault
  }

  return sanitized
}
