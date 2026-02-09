import { logTestCase } from '../helpers/testLogger'
import { hashPassword, comparePassword } from '../../utils/password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should return a hashed string different from the input', async () => {
      const password = 'MySecret123!'
      const hash = await hashPassword(password)
      logTestCase('Hash differs from plaintext', {
        input: password,
        expected: 'hash !== password',
        actual: `hash: ${hash.substring(0, 20)}...`,
      })
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce a bcrypt hash starting with $2', async () => {
      const hash = await hashPassword('Test1234!')
      logTestCase('Hash format starts with $2', {
        input: 'Test1234!',
        expected: 'starts with $2',
        actual: hash.substring(0, 3),
      })
      expect(hash.startsWith('$2')).toBe(true)
    })

    it('should generate different hashes for the same input (salt)', async () => {
      const password = 'SamePassword1!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      logTestCase('Different hashes for same input', {
        input: password,
        expected: 'hash1 !== hash2',
        actual: { hash1: hash1.substring(0, 20), hash2: hash2.substring(0, 20) },
      })
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'CorrectPass1!'
      const hash = await hashPassword(password)
      const actual = await comparePassword(password, hash)
      logTestCase('Correct password match', {
        input: { password, hash: hash.substring(0, 20) + '...' },
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })

    it('should return false for wrong password', async () => {
      const hash = await hashPassword('CorrectPass1!')
      const actual = await comparePassword('WrongPass1!', hash)
      logTestCase('Wrong password mismatch', {
        input: { password: 'WrongPass1!', hash: hash.substring(0, 20) + '...' },
        expected: false,
        actual,
      })
      expect(actual).toBe(false)
    })

    it('should return false for empty password against a hash', async () => {
      const hash = await hashPassword('SomePass1!')
      const actual = await comparePassword('', hash)
      logTestCase('Empty password mismatch', {
        input: { password: '', hash: hash.substring(0, 20) + '...' },
        expected: false,
        actual,
      })
      expect(actual).toBe(false)
    })

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#%^&*()'
      const hash = await hashPassword(password)
      const actual = await comparePassword(password, hash)
      logTestCase('Special characters password', {
        input: { password },
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })

    it('should handle very long passwords', async () => {
      const password = 'A'.repeat(100) + '1!a'
      const hash = await hashPassword(password)
      const actual = await comparePassword(password, hash)
      logTestCase('Very long password', {
        input: { passwordLength: password.length },
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })
  })
})
