import { logTestCase } from '../helpers/testLogger'
import {
  validatePagination,
  validateStringLength,
  MAX_STRING_LENGTHS,
  VALID_LIMITS,
} from '../../validators/admin/shared'
import { validateCreateCategory } from '../../validators/admin/categories.validator'
import { validateCreatePlace, validatePlaceFilters } from '../../validators/admin/places.validator'
import { validateCreateUser, validateUserFilters } from '../../validators/admin/users.validator'
import { validateCreateOrder, validateCreateOrderItem } from '../../validators/admin/orders.validator'
import { BadRequestError } from '../../utils/errors'

describe('Admin Validators', () => {
  describe('validatePagination', () => {
    it('should use defaults when no params provided', () => {
      const actual = validatePagination({})
      logTestCase('Default pagination', {
        input: {},
        expected: { page: 1, limit: 10 },
        actual,
      })
      expect(actual.page).toBe(1)
      expect(actual.limit).toBe(10)
    })

    it('should parse valid page and limit', () => {
      const actual = validatePagination({ page: '3', limit: '25' })
      logTestCase('Custom pagination', {
        input: { page: '3', limit: '25' },
        expected: { page: 3, limit: 25 },
        actual,
      })
      expect(actual.page).toBe(3)
      expect(actual.limit).toBe(25)
    })

    it.each(VALID_LIMITS)('should accept limit: %d', (limit) => {
      const actual = validatePagination({ limit: String(limit) })
      logTestCase(`Limit ${limit}`, {
        input: { limit: String(limit) },
        expected: limit,
        actual: actual.limit,
      })
      expect(actual.limit).toBe(limit)
    })

    it('should reject invalid limit', () => {
      try {
        validatePagination({ limit: '15' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Invalid limit 15', {
          input: { limit: '15' },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject page 0', () => {
      try {
        validatePagination({ page: '0' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Page 0', {
          input: { page: '0' },
          expected: 'BadRequestError: Invalid page',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject negative page', () => {
      try {
        validatePagination({ page: '-1' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Negative page', {
          input: { page: '-1' },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject non-numeric page', () => {
      try {
        validatePagination({ page: 'abc' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Non-numeric page', {
          input: { page: 'abc' },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should parse search and trim it', () => {
      const actual = validatePagination({ search: '  pizza  ' })
      logTestCase('Search trimmed', {
        input: { search: '  pizza  ' },
        expected: 'pizza',
        actual: actual.search,
      })
      expect(actual.search).toBe('pizza')
    })

    it('should set search to undefined for empty string', () => {
      const actual = validatePagination({ search: '   ' })
      logTestCase('Empty search → undefined', {
        input: { search: '   ' },
        expected: undefined,
        actual: actual.search,
      })
      expect(actual.search).toBeUndefined()
    })

    it('should parse sortOrder asc', () => {
      const actual = validatePagination({ sortOrder: 'asc' })
      logTestCase('Sort order asc', {
        input: { sortOrder: 'asc' },
        expected: 'asc',
        actual: actual.sortOrder,
      })
      expect(actual.sortOrder).toBe('asc')
    })

    it('should parse sortOrder desc', () => {
      const actual = validatePagination({ sortOrder: 'desc' })
      logTestCase('Sort order desc', {
        input: { sortOrder: 'desc' },
        expected: 'desc',
        actual: actual.sortOrder,
      })
      expect(actual.sortOrder).toBe('desc')
    })

    it('should set sortOrder to undefined for invalid value', () => {
      const actual = validatePagination({ sortOrder: 'random' })
      logTestCase('Invalid sort order', {
        input: { sortOrder: 'random' },
        expected: undefined,
        actual: actual.sortOrder,
      })
      expect(actual.sortOrder).toBeUndefined()
    })
  })

  describe('validateStringLength', () => {
    it('should pass for string within default limit', () => {
      expect(() => validateStringLength('hello', 'default')).not.toThrow()
      logTestCase('String within limit', {
        input: { value: 'hello', field: 'default' },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should throw for string exceeding field limit', () => {
      const longName = 'A'.repeat(101)
      try {
        validateStringLength(longName, 'name')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Name > 100 chars', {
          input: { valueLength: 101, field: 'name', maxLength: MAX_STRING_LENGTHS.name },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept string at exactly the limit', () => {
      const exactName = 'A'.repeat(100)
      expect(() => validateStringLength(exactName, 'name')).not.toThrow()
      logTestCase('Name = 100 chars', {
        input: { valueLength: 100, field: 'name' },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should skip validation for undefined', () => {
      expect(() => validateStringLength(undefined, 'name')).not.toThrow()
      logTestCase('Undefined value', {
        input: { value: undefined, field: 'name' },
        expected: 'no error (skipped)',
        actual: 'no error',
      })
    })

    it('should use custom maxLength when provided', () => {
      try {
        validateStringLength('toolong', 'custom', 5)
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Custom maxLength', {
          input: { value: 'toolong', maxLength: 5 },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validateCreateCategory', () => {
    it('should accept valid category', () => {
      expect(() => validateCreateCategory({ name: 'Pizza' })).not.toThrow()
      logTestCase('Valid category', {
        input: { name: 'Pizza' },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject missing name', () => {
      try {
        validateCreateCategory({ name: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing category name', {
          input: { name: '' },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject name exceeding length limit', () => {
      try {
        validateCreateCategory({ name: 'A'.repeat(101) })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Category name too long', {
          input: { nameLength: 101 },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept category with description', () => {
      expect(() =>
        validateCreateCategory({ name: 'Italian', description: 'Italian cuisine' })
      ).not.toThrow()
      logTestCase('Category with description', {
        input: { name: 'Italian', description: 'Italian cuisine' },
        expected: 'no error',
        actual: 'no error',
      })
    })
  })

  describe('validateCreatePlace', () => {
    const validPlace = { address: '123 Main St', city: 'Sarajevo', country: 'Bosnia' }

    it('should accept valid place', () => {
      expect(() => validateCreatePlace(validPlace)).not.toThrow()
      logTestCase('Valid place', {
        input: validPlace,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject missing address', () => {
      try {
        validateCreatePlace({ ...validPlace, address: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing address', {
          input: '...address: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject missing city', () => {
      try {
        validateCreatePlace({ ...validPlace, city: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing city', {
          input: '...city: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject missing country', () => {
      try {
        validateCreatePlace({ ...validPlace, country: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing country', {
          input: '...country: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject address exceeding length limit', () => {
      try {
        validateCreatePlace({ ...validPlace, address: 'A'.repeat(501) })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Address too long', {
          input: { addressLength: 501 },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept place with optional state and postalCode', () => {
      expect(() =>
        validateCreatePlace({ ...validPlace, state: 'FBiH', postalCode: '71000' })
      ).not.toThrow()
      logTestCase('Place with optional fields', {
        input: { ...validPlace, state: 'FBiH', postalCode: '71000' },
        expected: 'no error',
        actual: 'no error',
      })
    })
  })

  describe('validatePlaceFilters', () => {
    it('should return empty filters for empty query', () => {
      const actual = validatePlaceFilters({})
      logTestCase('Empty place filters', {
        input: {},
        expected: {},
        actual,
      })
      expect(actual).toEqual({})
    })

    it('should pass through city filter', () => {
      const actual = validatePlaceFilters({ city: 'Sarajevo' })
      logTestCase('City filter', {
        input: { city: 'Sarajevo' },
        expected: { city: 'Sarajevo' },
        actual,
      })
      expect(actual.city).toBe('Sarajevo')
    })

    it('should pass through all filters', () => {
      const query = { city: 'Mostar', state: 'HNK', country: 'BA', postalCode: '88000' }
      const actual = validatePlaceFilters(query)
      logTestCase('All place filters', {
        input: query,
        expected: query,
        actual,
      })
      expect(actual).toEqual(query)
    })
  })

  describe('validateUserFilters', () => {
    it('should return empty filters for empty query', () => {
      const actual = validateUserFilters({})
      logTestCase('Empty user filters', {
        input: {},
        expected: {},
        actual,
      })
      expect(actual).toEqual({})
    })

    it('should accept valid role filter', () => {
      const actual = validateUserFilters({ role: 'CUSTOMER' })
      logTestCase('Role filter: CUSTOMER', {
        input: { role: 'CUSTOMER' },
        expected: { role: 'CUSTOMER' },
        actual,
      })
      expect(actual.role).toBe('CUSTOMER')
    })

    it('should ignore invalid role', () => {
      const actual = validateUserFilters({ role: 'INVALID_ROLE' })
      logTestCase('Invalid role ignored', {
        input: { role: 'INVALID_ROLE' },
        expected: {},
        actual,
      })
      expect(actual.role).toBeUndefined()
    })

    it('should parse emailVerified true', () => {
      const actual = validateUserFilters({ emailVerified: 'true' })
      logTestCase('emailVerified true', {
        input: { emailVerified: 'true' },
        expected: { emailVerified: true },
        actual,
      })
      expect(actual.emailVerified).toBe(true)
    })

    it('should parse emailVerified false', () => {
      const actual = validateUserFilters({ emailVerified: 'false' })
      logTestCase('emailVerified false', {
        input: { emailVerified: 'false' },
        expected: { emailVerified: false },
        actual,
      })
      expect(actual.emailVerified).toBe(false)
    })
  })

  describe('validateCreateUser', () => {
    const validUser = {
      email: 'user@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+38761123456',
    }

    it('should accept valid user data', () => {
      expect(() => validateCreateUser(validUser)).not.toThrow()
      logTestCase('Valid user', {
        input: validUser,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject missing email', () => {
      try {
        validateCreateUser({ ...validUser, email: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing email', {
          input: '...email: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject invalid email format', () => {
      try {
        validateCreateUser({ ...validUser, email: 'notanemail' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Invalid email', {
          input: '...email: "notanemail"',
          expected: 'Invalid email',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject short password', () => {
      try {
        validateCreateUser({ ...validUser, password: 'short' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Short password', {
          input: '...password: "short"',
          expected: 'Password too short',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject invalid role', () => {
      try {
        validateCreateUser({ ...validUser, role: 'INVALID_ROLE' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Invalid role INVALID_ROLE', {
          input: '...role: "INVALID_ROLE"',
          expected: 'Invalid role',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept valid role', () => {
      expect(() =>
        validateCreateUser({ ...validUser, role: 'DELIVERY_DRIVER' })
      ).not.toThrow()
      logTestCase('Valid role DELIVERY_DRIVER', {
        input: '...role: "DELIVERY_DRIVER"',
        expected: 'no error',
        actual: 'no error',
      })
    })
  })

  describe('validateCreateOrder', () => {
    const validOrder = {
      userId: 'user-1',
      restaurantId: 'rest-1',
      deliveryPlaceId: 'place-1',
      subtotal: 25.50,
    }

    it('should accept valid order', () => {
      expect(() => validateCreateOrder(validOrder)).not.toThrow()
      logTestCase('Valid order', {
        input: validOrder,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject missing userId', () => {
      try {
        validateCreateOrder({ ...validOrder, userId: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing userId', {
          input: '...userId: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject negative subtotal', () => {
      try {
        validateCreateOrder({ ...validOrder, subtotal: -5 })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Negative subtotal', {
          input: '...subtotal: -5',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept subtotal of 0', () => {
      expect(() => validateCreateOrder({ ...validOrder, subtotal: 0 })).not.toThrow()
      logTestCase('Zero subtotal', {
        input: '...subtotal: 0',
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject invalid status', () => {
      try {
        validateCreateOrder({ ...validOrder, status: 'INVALID' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Invalid order status', {
          input: '...status: "INVALID"',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validateCreateOrderItem', () => {
    it('should accept valid order item', () => {
      expect(() =>
        validateCreateOrderItem({ menuItemId: 'item-1', quantity: 2 })
      ).not.toThrow()
      logTestCase('Valid order item', {
        input: { menuItemId: 'item-1', quantity: 2 },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject missing menuItemId', () => {
      try {
        validateCreateOrderItem({ menuItemId: '', quantity: 1 })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing menuItemId', {
          input: { menuItemId: '', quantity: 1 },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject quantity of 0', () => {
      try {
        validateCreateOrderItem({ menuItemId: 'item-1', quantity: 0 })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Quantity 0', {
          input: { menuItemId: 'item-1', quantity: 0 },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject negative quantity', () => {
      try {
        validateCreateOrderItem({ menuItemId: 'item-1', quantity: -1 })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Negative quantity', {
          input: { menuItemId: 'item-1', quantity: -1 },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject non-integer quantity', () => {
      try {
        validateCreateOrderItem({ menuItemId: 'item-1', quantity: 1.5 })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Non-integer quantity', {
          input: { menuItemId: 'item-1', quantity: 1.5 },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept quantity of 1', () => {
      expect(() =>
        validateCreateOrderItem({ menuItemId: 'item-1', quantity: 1 })
      ).not.toThrow()
      logTestCase('Minimum valid quantity', {
        input: { menuItemId: 'item-1', quantity: 1 },
        expected: 'no error',
        actual: 'no error',
      })
    })
  })
})
