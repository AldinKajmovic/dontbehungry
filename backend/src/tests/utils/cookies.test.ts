import { Response } from 'express'
import { clearAuthCookies } from '../../utils/cookies'

describe('Cookie utilities', () => {
  describe('clearAuthCookies', () => {
    it('clears auth and CSRF secret cookies', () => {
      const res = {
        clearCookie: jest.fn(),
      } as unknown as Response

      clearAuthCookies(res)

      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({
        path: '/',
      }))
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({
        path: '/api/auth',
      }))
      expect(res.clearCookie).toHaveBeenCalledWith('_csrfSecret', expect.objectContaining({
        httpOnly: true,
        path: '/',
      }))
    })
  })
})
