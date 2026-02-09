import { logTestCase } from '../helpers/testLogger'
import {
  validateEmail,
  validatePassword,
  validateRegister,
  validateRegisterRestaurant,
  validateLogin,
} from '../../validators/auth.validator'
import { BadRequestError } from '../../utils/errors'

describe('Auth Validators', () => {
  describe('validateEmail', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co',
      'name+tag@company.org',
      'first.last@sub.domain.com',
    ]

    it.each(validEmails)('should accept valid email: %s', (email) => {
      expect(() => validateEmail(email)).not.toThrow()
      logTestCase(`validateEmail("${email}")`, {
        input: email,
        expected: 'no error',
        actual: 'no error',
      })
    })

    const invalidEmails = [
      'plaintext',
      '@domain.com',
      'user@',
      'user@.com',
      'user@domain',
      'user @domain.com',
      '',
    ]

    it.each(invalidEmails)('should reject invalid email: %s', (email) => {
      try {
        validateEmail(email)
        fail('Expected BadRequestError')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase(`validateEmail("${email}")`, {
          input: email,
          expected: 'BadRequestError: Invalid email',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validatePassword', () => {
    const validPasswords = ['Abcdef1!', 'MyP@ssw0rd', 'C0mpl3x!Pass', 'Test#1234']

    it.each(validPasswords)('should accept valid password: %s', (password) => {
      expect(() => validatePassword(password)).not.toThrow()
      logTestCase(`validatePassword(valid)`, {
        input: `length: ${password.length}`,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject password shorter than 8 characters', () => {
      try {
        validatePassword('Ab1!')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Password too short')
        logTestCase('Short password', {
          input: 'Ab1! (4 chars)',
          expected: 'Password too short',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject password without uppercase', () => {
      try {
        validatePassword('abcdefg1!')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Password too weak')
        logTestCase('No uppercase', {
          input: 'abcdefg1!',
          expected: 'Password too weak',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject password without lowercase', () => {
      try {
        validatePassword('ABCDEFG1!')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Password too weak')
        logTestCase('No lowercase', {
          input: 'ABCDEFG1!',
          expected: 'Password too weak',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject password without digits', () => {
      try {
        validatePassword('Abcdefgh!')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Password too weak')
        logTestCase('No digits', {
          input: 'Abcdefgh!',
          expected: 'Password too weak',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject password without special characters', () => {
      try {
        validatePassword('Abcdefg1')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Password too weak')
        logTestCase('No special chars', {
          input: 'Abcdefg1',
          expected: 'Password too weak',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validateRegister', () => {
    const validData = {
      email: 'user@test.com',
      password: 'MyPass1!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+38761123456',
    }

    it('should accept valid registration data', () => {
      expect(() => validateRegister(validData)).not.toThrow()
      logTestCase('Valid registration', {
        input: validData,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject when email is missing', () => {
      try {
        validateRegister({ ...validData, email: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing email', {
          input: { ...validData, email: '' },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when password is missing', () => {
      try {
        validateRegister({ ...validData, password: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing password', {
          input: '...password: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when firstName is missing', () => {
      try {
        validateRegister({ ...validData, firstName: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing firstName', {
          input: '...firstName: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when lastName is missing', () => {
      try {
        validateRegister({ ...validData, lastName: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing lastName', {
          input: '...lastName: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when phone is missing', () => {
      try {
        validateRegister({ ...validData, phone: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing phone', {
          input: '...phone: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject invalid email format in register', () => {
      try {
        validateRegister({ ...validData, email: 'not-an-email' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Invalid email')
        logTestCase('Invalid email in register', {
          input: '...email: "not-an-email"',
          expected: 'Invalid email',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject weak password in register', () => {
      try {
        validateRegister({ ...validData, password: 'weak' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Weak password in register', {
          input: '...password: "weak"',
          expected: 'Password too short or weak',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validateRegisterRestaurant', () => {
    const validRestaurantData = {
      email: 'owner@test.com',
      password: 'MyPass1!',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+38761123456',
      restaurantName: 'Best Food',
      address: '123 Main St',
      city: 'Sarajevo',
      country: 'Bosnia',
    }

    it('should accept valid restaurant registration', () => {
      expect(() => validateRegisterRestaurant(validRestaurantData)).not.toThrow()
      logTestCase('Valid restaurant registration', {
        input: validRestaurantData,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject when restaurantName is missing', () => {
      try {
        validateRegisterRestaurant({ ...validRestaurantData, restaurantName: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Missing restaurantName', {
          input: '...restaurantName: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when address is missing', () => {
      try {
        validateRegisterRestaurant({ ...validRestaurantData, address: '' })
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

    it('should reject when city is missing', () => {
      try {
        validateRegisterRestaurant({ ...validRestaurantData, city: '' })
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

    it('should reject when country is missing', () => {
      try {
        validateRegisterRestaurant({ ...validRestaurantData, country: '' })
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

    it('should also validate base register fields', () => {
      try {
        validateRegisterRestaurant({ ...validRestaurantData, email: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Restaurant reg: missing email', {
          input: '...email: ""',
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validateLogin', () => {
    it('should accept valid login data', () => {
      const data = { email: 'user@test.com', password: 'anything' }
      expect(() => validateLogin(data)).not.toThrow()
      logTestCase('Valid login', {
        input: data,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject when email is missing', () => {
      try {
        validateLogin({ email: '', password: 'pass' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Missing credentials')
        logTestCase('Login: missing email', {
          input: { email: '', password: 'pass' },
          expected: 'Missing credentials',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when password is missing', () => {
      try {
        validateLogin({ email: 'user@test.com', password: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Missing credentials')
        logTestCase('Login: missing password', {
          input: { email: 'user@test.com', password: '' },
          expected: 'Missing credentials',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when both are missing', () => {
      try {
        validateLogin({ email: '', password: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Login: both missing', {
          input: { email: '', password: '' },
          expected: 'Missing credentials',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })
})
