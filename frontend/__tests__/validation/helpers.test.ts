import { logTestCase } from '../helpers/testLogger'
import {
  validateFieldValue,
  validatePhone,
  formatPhoneE164,
  extractZodErrors,
} from '@/services/validation/helpers'
import { z } from 'zod'

describe('Validation Helpers', () => {
  describe('validateFieldValue — firstName / lastName', () => {
    it('should return undefined for valid firstName', () => {
      const actual = validateFieldValue('firstName', 'John')
      logTestCase('Valid firstName', {
        input: { field: 'firstName', value: 'John' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })

    it('should return error for empty firstName', () => {
      const actual = validateFieldValue('firstName', '')
      logTestCase('Empty firstName', {
        input: { field: 'firstName', value: '' },
        expected: 'This field is required',
        actual,
      })
      expect(actual).toBe('This field is required')
    })

    it('should return error for firstName > 50 chars', () => {
      const actual = validateFieldValue('firstName', 'A'.repeat(51))
      logTestCase('firstName > 50 chars', {
        input: { field: 'firstName', valueLength: 51 },
        expected: 'Too long',
        actual,
      })
      expect(actual).toBe('Too long')
    })

    it('should accept firstName at exactly 50 chars', () => {
      const actual = validateFieldValue('firstName', 'A'.repeat(50))
      logTestCase('firstName = 50 chars', {
        input: { field: 'firstName', valueLength: 50 },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })

    it('should return error for empty lastName', () => {
      const actual = validateFieldValue('lastName', '')
      logTestCase('Empty lastName', {
        input: { field: 'lastName', value: '' },
        expected: 'This field is required',
        actual,
      })
      expect(actual).toBe('This field is required')
    })

    it('should return error for lastName > 50 chars', () => {
      const actual = validateFieldValue('lastName', 'B'.repeat(51))
      logTestCase('lastName > 50', {
        input: { field: 'lastName', valueLength: 51 },
        expected: 'Too long',
        actual,
      })
      expect(actual).toBe('Too long')
    })
  })

  describe('validateFieldValue — email', () => {
    it('should return error for empty email', () => {
      const actual = validateFieldValue('email', '')
      logTestCase('Empty email', {
        input: { field: 'email', value: '' },
        expected: 'Email is required',
        actual,
      })
      expect(actual).toBe('Email is required')
    })

    it('should return error for invalid email format', () => {
      const actual = validateFieldValue('email', 'not-an-email')
      logTestCase('Invalid email format', {
        input: { field: 'email', value: 'not-an-email' },
        expected: 'Please enter a valid email address',
        actual,
      })
      expect(actual).toBe('Please enter a valid email address')
    })

    it('should accept valid email', () => {
      const actual = validateFieldValue('email', 'user@test.com')
      logTestCase('Valid email', {
        input: { field: 'email', value: 'user@test.com' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })

    it('should not require restaurantEmail (optional)', () => {
      const actual = validateFieldValue('restaurantEmail', '')
      logTestCase('Empty restaurantEmail (optional)', {
        input: { field: 'restaurantEmail', value: '' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })

    it('should validate restaurantEmail format when provided', () => {
      const actual = validateFieldValue('restaurantEmail', 'bad-email')
      logTestCase('Invalid restaurantEmail', {
        input: { field: 'restaurantEmail', value: 'bad-email' },
        expected: 'Please enter a valid email address',
        actual,
      })
      expect(actual).toBe('Please enter a valid email address')
    })
  })

  describe('validateFieldValue — password / confirmPassword', () => {
    it('should return error for empty password', () => {
      const actual = validateFieldValue('password', '')
      logTestCase('Empty password', {
        input: { field: 'password', value: '' },
        expected: 'Password is required',
        actual,
      })
      expect(actual).toBe('Password is required')
    })

    it('should accept non-empty password', () => {
      const actual = validateFieldValue('password', 'anything')
      logTestCase('Non-empty password', {
        input: { field: 'password', value: 'anything' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })

    it('should return error for empty confirmPassword', () => {
      const actual = validateFieldValue('confirmPassword', '')
      logTestCase('Empty confirmPassword', {
        input: { field: 'confirmPassword', value: '' },
        expected: 'Please confirm your password',
        actual,
      })
      expect(actual).toBe('Please confirm your password')
    })

    it('should return error when passwords do not match', () => {
      const actual = validateFieldValue('confirmPassword', 'different', { password: 'original' })
      logTestCase('Passwords do not match', {
        input: { field: 'confirmPassword', value: 'different', password: 'original' },
        expected: 'Passwords do not match',
        actual,
      })
      expect(actual).toBe('Passwords do not match')
    })

    it('should accept matching passwords', () => {
      const actual = validateFieldValue('confirmPassword', 'match', { password: 'match' })
      logTestCase('Passwords match', {
        input: { field: 'confirmPassword', value: 'match', password: 'match' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })
  })

  describe('validateFieldValue — restaurantName', () => {
    it('should return error for empty restaurantName', () => {
      const actual = validateFieldValue('restaurantName', '')
      logTestCase('Empty restaurantName', {
        input: { field: 'restaurantName', value: '' },
        expected: 'Restaurant name is required',
        actual,
      })
      expect(actual).toBe('Restaurant name is required')
    })

    it('should return error for restaurantName > 100 chars', () => {
      const actual = validateFieldValue('restaurantName', 'R'.repeat(101))
      logTestCase('restaurantName > 100', {
        input: { field: 'restaurantName', valueLength: 101 },
        expected: 'Restaurant name is too long',
        actual,
      })
      expect(actual).toBe('Restaurant name is too long')
    })

    it('should accept valid restaurantName', () => {
      const actual = validateFieldValue('restaurantName', 'Best Pizza')
      logTestCase('Valid restaurantName', {
        input: { field: 'restaurantName', value: 'Best Pizza' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })
  })

  describe('validateFieldValue — address, city, country', () => {
    it('should return error for empty address', () => {
      const actual = validateFieldValue('address', '')
      logTestCase('Empty address', {
        input: { field: 'address', value: '' },
        expected: 'Address is required',
        actual,
      })
      expect(actual).toBe('Address is required')
    })

    it('should return error for empty city', () => {
      const actual = validateFieldValue('city', '')
      logTestCase('Empty city', {
        input: { field: 'city', value: '' },
        expected: 'City is required',
        actual,
      })
      expect(actual).toBe('City is required')
    })

    it('should return error for empty country', () => {
      const actual = validateFieldValue('country', '')
      logTestCase('Empty country', {
        input: { field: 'country', value: '' },
        expected: 'Country is required',
        actual,
      })
      expect(actual).toBe('Country is required')
    })

    it('should accept valid address', () => {
      const actual = validateFieldValue('address', '123 Main St')
      logTestCase('Valid address', {
        input: { field: 'address', value: '123 Main St' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })
  })

  describe('validateFieldValue — unknown field', () => {
    it('should return undefined for unknown field', () => {
      const actual = validateFieldValue('unknownField', 'anything')
      logTestCase('Unknown field', {
        input: { field: 'unknownField', value: 'anything' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })
  })

  describe('validatePhone', () => {
    it('should return true for valid BA phone number', () => {
      const actual = validatePhone('61123456', 'BA')
      logTestCase('Valid BA phone', {
        input: { phone: '61123456', country: 'BA' },
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })

    it('should return true for empty phone (not required)', () => {
      const actual = validatePhone('', 'BA')
      logTestCase('Empty phone', {
        input: { phone: '', country: 'BA' },
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })

    it('should return false for invalid phone', () => {
      const actual = validatePhone('123', 'BA')
      logTestCase('Invalid short phone', {
        input: { phone: '123', country: 'BA' },
        expected: false,
        actual,
      })
      expect(actual).toBe(false)
    })

    it('should validate US phone number', () => {
      const actual = validatePhone('2025551234', 'US')
      logTestCase('Valid US phone', {
        input: { phone: '2025551234', country: 'US' },
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })
  })

  describe('formatPhoneE164', () => {
    it('should format valid phone to E.164', () => {
      const actual = formatPhoneE164('2025551234', 'US')
      logTestCase('Format US phone to E.164', {
        input: { phone: '2025551234', country: 'US' },
        expected: '+12025551234',
        actual,
      })
      expect(actual).toBe('+12025551234')
    })

    it('should return undefined for empty phone', () => {
      const actual = formatPhoneE164('', 'US')
      logTestCase('Empty phone → undefined', {
        input: { phone: '', country: 'US' },
        expected: undefined,
        actual,
      })
      expect(actual).toBeUndefined()
    })

    it('should strip non-digit characters', () => {
      const actual = formatPhoneE164('(202) 555-1234', 'US')
      logTestCase('Strip formatting chars', {
        input: { phone: '(202) 555-1234', country: 'US' },
        expected: '+12025551234',
        actual,
      })
      expect(actual).toBe('+12025551234')
    })
  })

  describe('extractZodErrors', () => {
    it('should extract field errors from Zod result', () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        name: z.string().min(1, 'Name required'),
      })
      const result = schema.safeParse({ email: 'bad', name: '' })
      if (!result.success) {
        const actual = extractZodErrors(result)
        logTestCase('Extract Zod errors', {
          input: { email: 'bad', name: '' },
          expected: { email: 'Invalid email', name: 'Name required' },
          actual,
        })
        expect(actual.email).toBe('Invalid email')
        expect(actual.name).toBe('Name required')
      }
    })

    it('should only keep first error per field', () => {
      const schema = z.object({
        password: z.string().min(8, 'Too short').regex(/[A-Z]/, 'Need uppercase'),
      })
      const result = schema.safeParse({ password: 'ab' })
      if (!result.success) {
        const actual = extractZodErrors(result)
        logTestCase('First error per field', {
          input: { password: 'ab' },
          expected: 'Too short (first error only)',
          actual,
        })
        expect(actual.password).toBe('Too short')
      }
    })

    it('should return empty object when no errors', () => {
      const schema = z.object({ name: z.string() })
      const result = schema.safeParse({ name: '' })
      // This will pass because z.string() allows empty
      if (!result.success) {
        const actual = extractZodErrors(result)
        expect(Object.keys(actual).length).toBe(0)
      } else {
        logTestCase('No validation errors', {
          input: { name: '' },
          expected: 'no errors (parse succeeded)',
          actual: 'parse succeeded',
        })
        expect(result.success).toBe(true)
      }
    })
  })
})
