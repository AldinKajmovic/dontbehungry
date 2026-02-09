import { logTestCase } from '../helpers/testLogger'
import {
  loginSchema,
  registerSchema,
  registerRestaurantSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  optionalEmailSchema,
} from '@/services/validation/schemas'

describe('Zod Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('user@test.com')
      logTestCase('Valid email', {
        input: 'user@test.com',
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('notanemail')
      logTestCase('Invalid email', {
        input: 'notanemail',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty string', () => {
      const result = emailSchema.safeParse('')
      logTestCase('Empty email', {
        input: '',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('passwordSchema', () => {
    it('should accept non-empty password', () => {
      const result = passwordSchema.safeParse('anything')
      logTestCase('Non-empty password', {
        input: 'anything',
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty password', () => {
      const result = passwordSchema.safeParse('')
      logTestCase('Empty password', {
        input: '',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('nameSchema', () => {
    it('should accept valid name', () => {
      const result = nameSchema.safeParse('John')
      logTestCase('Valid name', {
        input: 'John',
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = nameSchema.safeParse('')
      logTestCase('Empty name', {
        input: '',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 50 characters', () => {
      const result = nameSchema.safeParse('A'.repeat(51))
      logTestCase('Name > 50 chars', {
        input: `${'A'.repeat(51)} (51 chars)`,
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should accept name at exactly 50 characters', () => {
      const result = nameSchema.safeParse('A'.repeat(50))
      logTestCase('Name = 50 chars', {
        input: `${'A'.repeat(50)} (50 chars)`,
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('optionalEmailSchema', () => {
    it('should accept valid email', () => {
      const result = optionalEmailSchema.safeParse('user@test.com')
      logTestCase('Optional email: valid', {
        input: 'user@test.com',
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty string', () => {
      const result = optionalEmailSchema.safeParse('')
      logTestCase('Optional email: empty', {
        input: '',
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = optionalEmailSchema.safeParse('bademail')
      logTestCase('Optional email: invalid', {
        input: 'bademail',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const data = { email: 'user@test.com', password: 'pass123' }
      const result = loginSchema.safeParse(data)
      logTestCase('Valid login', {
        input: data,
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing email', () => {
      const data = { email: '', password: 'pass123' }
      const result = loginSchema.safeParse(data)
      logTestCase('Login: missing email', {
        input: data,
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const data = { email: 'notanemail', password: 'pass123' }
      const result = loginSchema.safeParse(data)
      logTestCase('Login: invalid email', {
        input: data,
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const data = { email: 'user@test.com', password: '' }
      const result = loginSchema.safeParse(data)
      logTestCase('Login: empty password', {
        input: data,
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing fields entirely', () => {
      const result = loginSchema.safeParse({})
      logTestCase('Login: empty object', {
        input: {},
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '+38761123456',
      password: 'MyPass1!',
      confirmPassword: 'MyPass1!',
    }

    it('should accept valid registration', () => {
      const result = registerSchema.safeParse(validData)
      logTestCase('Valid registration', {
        input: validData,
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const data = { ...validData, confirmPassword: 'different' }
      const result = registerSchema.safeParse(data)
      logTestCase('Mismatched passwords', {
        input: { ...data, password: '***', confirmPassword: '***different' },
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing firstName', () => {
      const data = { ...validData, firstName: '' }
      const result = registerSchema.safeParse(data)
      logTestCase('Missing firstName', {
        input: { ...data },
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing lastName', () => {
      const data = { ...validData, lastName: '' }
      const result = registerSchema.safeParse(data)
      logTestCase('Missing lastName', {
        input: { ...data },
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing phone', () => {
      const data = { ...validData, phone: '' }
      const result = registerSchema.safeParse(data)
      logTestCase('Missing phone', {
        input: { ...data },
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const data = { ...validData, email: 'bad' }
      const result = registerSchema.safeParse(data)
      logTestCase('Invalid email in register', {
        input: { ...data },
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject firstName longer than 50 chars', () => {
      const data = { ...validData, firstName: 'A'.repeat(51) }
      const result = registerSchema.safeParse(data)
      logTestCase('firstName > 50', {
        input: '...firstName length 51',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional address, city, country', () => {
      const data = { ...validData, address: '123 St', city: 'Sarajevo', country: 'BA' }
      const result = registerSchema.safeParse(data)
      logTestCase('With optional location fields', {
        input: data,
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('registerRestaurantSchema', () => {
    const validData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      phone: '+38761123456',
      password: 'MyPass1!',
      confirmPassword: 'MyPass1!',
      restaurantName: 'Best Pizza',
      address: '123 Main St',
      city: 'Sarajevo',
      country: 'Bosnia',
    }

    it('should accept valid restaurant registration', () => {
      const result = registerRestaurantSchema.safeParse(validData)
      logTestCase('Valid restaurant registration', {
        input: validData,
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing restaurantName', () => {
      const data = { ...validData, restaurantName: '' }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('Missing restaurantName', {
        input: '...restaurantName: ""',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject restaurantName > 100 chars', () => {
      const data = { ...validData, restaurantName: 'R'.repeat(101) }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('restaurantName > 100', {
        input: '...restaurantName length 101',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing address', () => {
      const data = { ...validData, address: '' }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('Missing address', {
        input: '...address: ""',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing city', () => {
      const data = { ...validData, city: '' }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('Missing city', {
        input: '...city: ""',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing country', () => {
      const data = { ...validData, country: '' }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('Missing country', {
        input: '...country: ""',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const data = { ...validData, confirmPassword: 'wrong' }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('Mismatched passwords (restaurant)', {
        input: '...confirmPassword: "wrong"',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional restaurantDescription', () => {
      const data = { ...validData, restaurantDescription: 'Great food!' }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('With description', {
        input: '...restaurantDescription: "Great food!"',
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })

    it('should reject restaurantDescription > 500 chars', () => {
      const data = { ...validData, restaurantDescription: 'D'.repeat(501) }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('Description > 500', {
        input: '...restaurantDescription length 501',
        expected: false,
        actual: result.success,
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional postalCode, minOrderAmount, deliveryFee', () => {
      const data = {
        ...validData,
        postalCode: '71000',
        minOrderAmount: '10',
        deliveryFee: '3',
      }
      const result = registerRestaurantSchema.safeParse(data)
      logTestCase('With optional numeric fields', {
        input: data,
        expected: true,
        actual: result.success,
      })
      expect(result.success).toBe(true)
    })
  })
})
