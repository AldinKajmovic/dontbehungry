import { logTestCase } from '../helpers/testLogger'
import {
  validateUpdateProfile,
  validateChangePassword,
} from '../../validators/profile.validator'
import { BadRequestError } from '../../utils/errors'

describe('Profile Validators', () => {
  describe('validateUpdateProfile', () => {
    it('should accept valid profile update', () => {
      const data = { firstName: 'John', lastName: 'Doe', phone: '+38761123456' }
      expect(() => validateUpdateProfile(data)).not.toThrow()
      logTestCase('Valid profile update', {
        input: data,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should accept update with only firstName', () => {
      expect(() => validateUpdateProfile({ firstName: 'Jane' })).not.toThrow()
      logTestCase('Only firstName', {
        input: { firstName: 'Jane' },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should accept empty object (no updates)', () => {
      expect(() => validateUpdateProfile({})).not.toThrow()
      logTestCase('Empty update', {
        input: {},
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject empty firstName', () => {
      try {
        validateUpdateProfile({ firstName: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Invalid first name')
        logTestCase('Empty firstName', {
          input: { firstName: '' },
          expected: 'Invalid first name',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject empty lastName', () => {
      try {
        validateUpdateProfile({ lastName: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Invalid last name')
        logTestCase('Empty lastName', {
          input: { lastName: '' },
          expected: 'Invalid last name',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject whitespace-only firstName', () => {
      try {
        validateUpdateProfile({ firstName: '   ' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Whitespace firstName', {
          input: { firstName: '   ' },
          expected: 'Invalid first name',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject firstName over 50 characters', () => {
      try {
        validateUpdateProfile({ firstName: 'A'.repeat(51) })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('First name too long')
        logTestCase('firstName > 50 chars', {
          input: { firstName: 'A x 51' },
          expected: 'First name too long',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept firstName at exactly 50 characters', () => {
      expect(() => validateUpdateProfile({ firstName: 'A'.repeat(50) })).not.toThrow()
      logTestCase('firstName = 50 chars', {
        input: { firstName: 'A x 50' },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject lastName over 50 characters', () => {
      try {
        validateUpdateProfile({ lastName: 'B'.repeat(51) })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Last name too long')
        logTestCase('lastName > 50 chars', {
          input: { lastName: 'B x 51' },
          expected: 'Last name too long',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject phone over 20 characters', () => {
      try {
        validateUpdateProfile({ phone: '1'.repeat(21) })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Phone too long')
        logTestCase('phone > 20 chars', {
          input: { phone: '1 x 21' },
          expected: 'Phone too long',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept phone at exactly 20 characters', () => {
      expect(() => validateUpdateProfile({ phone: '1'.repeat(20) })).not.toThrow()
      logTestCase('phone = 20 chars', {
        input: { phone: '1 x 20' },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject empty email', () => {
      try {
        validateUpdateProfile({ email: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Invalid email')
        logTestCase('Empty email', {
          input: { email: '' },
          expected: 'Invalid email',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject invalid email format', () => {
      try {
        validateUpdateProfile({ email: 'bad-email' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Invalid email')
        logTestCase('Invalid email format', {
          input: { email: 'bad-email' },
          expected: 'Invalid email',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept valid email update', () => {
      expect(() => validateUpdateProfile({ email: 'new@test.com' })).not.toThrow()
      logTestCase('Valid email update', {
        input: { email: 'new@test.com' },
        expected: 'no error',
        actual: 'no error',
      })
    })
  })

  describe('validateChangePassword', () => {
    it('should accept valid password change', () => {
      const data = { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' }
      expect(() => validateChangePassword(data)).not.toThrow()
      logTestCase('Valid password change', {
        input: data,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject missing currentPassword', () => {
      try {
        validateChangePassword({ currentPassword: '', newPassword: 'NewPass1!' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Missing current password')
        logTestCase('Missing currentPassword', {
          input: { currentPassword: '', newPassword: 'NewPass1!' },
          expected: 'Missing current password',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject missing newPassword', () => {
      try {
        validateChangePassword({ currentPassword: 'OldPass1!', newPassword: '' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Missing new password')
        logTestCase('Missing newPassword', {
          input: { currentPassword: 'OldPass1!', newPassword: '' },
          expected: 'Missing new password',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject newPassword shorter than 8 characters', () => {
      try {
        validateChangePassword({ currentPassword: 'OldPass1!', newPassword: 'Short1' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Password too short')
        logTestCase('New password too short', {
          input: { currentPassword: 'OldPass1!', newPassword: 'Short1' },
          expected: 'Password too short',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should reject when current and new passwords are the same', () => {
      try {
        validateChangePassword({ currentPassword: 'SamePass1!', newPassword: 'SamePass1!' })
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Same password')
        logTestCase('Same password', {
          input: { currentPassword: 'SamePass1!', newPassword: 'SamePass1!' },
          expected: 'Same password',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept newPassword at exactly 8 characters', () => {
      expect(() =>
        validateChangePassword({ currentPassword: 'OldPass1!', newPassword: '12345678' })
      ).not.toThrow()
      logTestCase('New password = 8 chars', {
        input: { newPassword: '12345678' },
        expected: 'no error',
        actual: 'no error',
      })
    })
  })
})
