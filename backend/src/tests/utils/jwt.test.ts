import { logTestCase } from '../helpers/testLogger'
import { generateAccessToken, generateRefreshTokenJwt, verifyToken } from '../../utils/jwt'

describe('JWT Utilities', () => {
  const testPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'CUSTOMER' as const,
  }

  describe('generateAccessToken', () => {
    it('should generate a non-empty string token', () => {
      const token = generateAccessToken(testPayload)
      logTestCase('Generate access token', {
        input: testPayload,
        expected: 'non-empty string',
        actual: `token length: ${token.length}`,
      })
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate a token with 3 parts (header.payload.signature)', () => {
      const token = generateAccessToken(testPayload)
      const parts = token.split('.')
      logTestCase('Token has 3 parts', {
        input: testPayload,
        expected: 3,
        actual: parts.length,
      })
      expect(parts.length).toBe(3)
    })

    it('should generate different tokens for different payloads', () => {
      const token1 = generateAccessToken(testPayload)
      const token2 = generateAccessToken({
        ...testPayload,
        userId: 'user-456',
      })
      logTestCase('Different payloads → different tokens', {
        input: { userId1: 'user-123', userId2: 'user-456' },
        expected: 'token1 !== token2',
        actual: token1 === token2 ? 'SAME' : 'DIFFERENT',
      })
      expect(token1).not.toBe(token2)
    })
  })

  describe('generateRefreshTokenJwt', () => {
    it('should generate a refresh token', () => {
      const token = generateRefreshTokenJwt({ userId: 'user-123' })
      logTestCase('Generate refresh token', {
        input: { userId: 'user-123' },
        expected: 'non-empty string with 3 parts',
        actual: `length: ${token.length}, parts: ${token.split('.').length}`,
      })
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })
  })

  describe('verifyToken', () => {
    it('should decode a valid access token and return the payload', () => {
      const token = generateAccessToken(testPayload)
      const decoded = verifyToken(token)
      logTestCase('Verify valid token', {
        input: `token for userId: ${testPayload.userId}`,
        expected: testPayload,
        actual: { userId: decoded.userId, email: decoded.email, role: decoded.role },
      })
      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
      expect(decoded.role).toBe(testPayload.role)
    })

    it('should throw for a malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token'
      try {
        verifyToken(malformedToken)
        fail('Expected error')
      } catch (error) {
        logTestCase('Malformed token', {
          input: malformedToken,
          expected: 'JsonWebTokenError',
          actual: (error as Error).name,
        })
        expect((error as Error).name).toBe('JsonWebTokenError')
      }
    })

    it('should throw for an empty token', () => {
      try {
        verifyToken('')
        fail('Expected error')
      } catch (error) {
        logTestCase('Empty token', {
          input: '',
          expected: 'Error',
          actual: (error as Error).name,
        })
        expect(error).toBeDefined()
      }
    })

    it('should throw for a tampered token', () => {
      const token = generateAccessToken(testPayload)
      const tampered = token.slice(0, -5) + 'XXXXX'
      try {
        verifyToken(tampered)
        fail('Expected error')
      } catch (error) {
        logTestCase('Tampered token', {
          input: 'token with modified signature',
          expected: 'JsonWebTokenError',
          actual: (error as Error).name,
        })
        expect((error as Error).name).toBe('JsonWebTokenError')
      }
    })

    it('should include iat and exp in decoded token', () => {
      const token = generateAccessToken(testPayload)
      const decoded = verifyToken(token) as unknown as Record<string, unknown>
      logTestCase('Token contains iat and exp', {
        input: 'valid token',
        expected: { hasIat: true, hasExp: true },
        actual: { hasIat: 'iat' in decoded, hasExp: 'exp' in decoded },
      })
      expect(decoded).toHaveProperty('iat')
      expect(decoded).toHaveProperty('exp')
    })
  })
})
