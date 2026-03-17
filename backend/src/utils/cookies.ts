import crypto from 'crypto'
import { Response } from 'express'
import { config } from '../config'

const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'
const CSRF_TOKEN_COOKIE = 'csrfToken'

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: config.cookie.accessMaxAge,
    path: '/',
  })
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: config.cookie.refreshMaxAge,
    path: '/api/auth', // Only sent to auth endpoints
  })
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  setAccessTokenCookie(res, accessToken)
  setRefreshTokenCookie(res, refreshToken)
  setCsrfTokenCookie(res)
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: '/',
  })
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: '/api/auth',
  })
  res.clearCookie(CSRF_TOKEN_COOKIE, {
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: '/',
  })
}

export function getRefreshTokenFromCookie(cookies: Record<string, string>): string | undefined {
  return cookies[REFRESH_TOKEN_COOKIE]
}

export function getAccessTokenFromCookie(cookies: Record<string, string>): string | undefined {
  return cookies[ACCESS_TOKEN_COOKIE]
}

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function setCsrfTokenCookie(res: Response, token = createCsrfToken()): string {
  res.cookie(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: config.cookie.refreshMaxAge,
    path: '/',
  })

  return token
}

export function getCsrfTokenFromCookie(cookies: Record<string, string>): string | undefined {
  return cookies[CSRF_TOKEN_COOKIE]
}
