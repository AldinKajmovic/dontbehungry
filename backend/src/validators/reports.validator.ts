import { BadRequestError } from '../utils/errors'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const VALID_REPORT_TYPES = [
  'orders',
  'restaurants',
  'users',
  'reviews',
  'categories',
  'menuItems',
  'places',
]

export interface EmailReportData {
  reportType: string
  email: string
  subject?: string
  message?: string
  filters?: Record<string, unknown>
  sections?: string[]
}

export interface CombinedReportData {
  sections: string[]
}

export function validateReportType(type: string): void {
  if (!type) {
    throw new BadRequestError('Missing report type', 'Report type is required')
  }

  if (!VALID_REPORT_TYPES.includes(type) && type !== 'combined') {
    throw new BadRequestError(
      'Invalid report type',
      `Report type must be one of: ${VALID_REPORT_TYPES.join(', ')}, combined`
    )
  }
}

export function validateEmailReportData(data: EmailReportData): void {
  const { reportType, email, sections } = data

  if (!reportType) {
    throw new BadRequestError('Missing report type', 'Report type is required')
  }

  if (!VALID_REPORT_TYPES.includes(reportType) && reportType !== 'combined') {
    throw new BadRequestError(
      'Invalid report type',
      `Report type must be one of: ${VALID_REPORT_TYPES.join(', ')}, combined`
    )
  }

  if (!email) {
    throw new BadRequestError('Missing email', 'Recipient email is required')
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid email address')
  }

  if (reportType === 'combined') {
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throw new BadRequestError(
        'Missing sections',
        'At least one section is required for combined reports'
      )
    }

    for (const section of sections) {
      if (!VALID_REPORT_TYPES.includes(section)) {
        throw new BadRequestError(
          'Invalid section',
          `Section "${section}" is not valid. Valid sections: ${VALID_REPORT_TYPES.join(', ')}`
        )
      }
    }
  }
}

export function validateCombinedReportData(data: CombinedReportData): void {
  const { sections } = data

  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    throw new BadRequestError(
      'Missing sections',
      'At least one section is required for combined reports'
    )
  }

  for (const section of sections) {
    if (!VALID_REPORT_TYPES.includes(section)) {
      throw new BadRequestError(
        'Invalid section',
        `Section "${section}" is not valid. Valid sections: ${VALID_REPORT_TYPES.join(', ')}`
      )
    }
  }
}

export function parseDateFilter(value: string | undefined): Date | undefined {
  if (!value) return undefined

  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return undefined
  }

  return date
}

export function createFilterDescription<T extends object>(
  filters: T
): Record<string, string> {
  const description: Record<string, string> = {}

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue

    const displayKey = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/Id$/, '')
      .trim()

    let displayValue: string
    if (value instanceof Date) {
      displayValue = value.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No'
    } else {
      displayValue = String(value)
    }

    description[displayKey] = displayValue
  }

  return description
}
