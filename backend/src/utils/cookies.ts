import { Response } from 'express'
import { config } from '../config'

const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'

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
}

export function getRefreshTokenFromCookie(cookies: Record<string, string>): string | undefined {
  return cookies[REFRESH_TOKEN_COOKIE]
}

export function getAccessTokenFromCookie(cookies: Record<string, string>): string | undefined {
  return cookies[ACCESS_TOKEN_COOKIE]
}
