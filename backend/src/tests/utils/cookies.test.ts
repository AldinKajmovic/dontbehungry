import { Response } from 'express'
import {
  clearAuthCookies,
  createCsrfToken,
  getCsrfTokenFromCookie,
  setCsrfTokenCookie,
} from '../../utils/cookies'

describe('Cookie utilities', () => {
  describe('createCsrfToken', () => {
    it('creates a random token', () => {
      const first = createCsrfToken()
      const second = createCsrfToken()

      expect(first).toHaveLength(64)
      expect(second).toHaveLength(64)
      expect(first).not.toBe(second)
    })
  })

  describe('setCsrfTokenCookie', () => {
    it('writes a readable csrf cookie and returns the token', () => {
      const res = {
        cookie: jest.fn(),
      } as unknown as Response

      const token = setCsrfTokenCookie(res, 'csrf-token')

      expect(token).toBe('csrf-token')
      expect(res.cookie).toHaveBeenCalledWith('csrfToken', 'csrf-token', expect.objectContaining({
        httpOnly: false,
        path: '/',
      }))
    })
  })

  describe('getCsrfTokenFromCookie', () => {
    it('returns the csrf token from cookies', () => {
      expect(getCsrfTokenFromCookie({ csrfToken: 'token-value' })).toBe('token-value')
    })
  })

  describe('clearAuthCookies', () => {
    it('clears the csrf cookie together with auth cookies', () => {
      const res = {
        clearCookie: jest.fn(),
      } as unknown as Response

      clearAuthCookies(res)

      expect(res.clearCookie).toHaveBeenCalledWith('csrfToken', expect.objectContaining({
        path: '/',
      }))
    })
  })
})
