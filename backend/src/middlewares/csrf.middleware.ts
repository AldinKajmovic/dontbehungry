import { NextFunction, Request, Response } from 'express'
import { getCsrfTokenFromCookie } from '../utils/cookies'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const CSRF_HEADER_NAME = 'x-csrf-token'

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next()
    return
  }

  const csrfCookie = getCsrfTokenFromCookie(req.cookies || {})
  const csrfHeader = req.header(CSRF_HEADER_NAME)

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    res.status(403).json({
      error: 'Forbidden',
      details: 'Missing or invalid CSRF token',
    })
    return
  }

  next()
}
