import { NextFunction, Request, Response } from 'express'
import { getCsrfTokenFromCookie } from '../utils/cookies'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const CSRF_HEADER_NAME = 'x-csrf-token'https://github.com/AldinKajmovic/dontbehungry/pull/31/conflict?name=backend%252Fsrc%252Fapp.ts&ancestor_oid=ba8c970b01ea72f2ca60613023922ed8d2207285&base_oid=2cb4a5128cc75d0b77273438cabcb0b417fe8d01&head_oid=8ba390c9bc48200df47e4c9dab4641d23dae6778

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
