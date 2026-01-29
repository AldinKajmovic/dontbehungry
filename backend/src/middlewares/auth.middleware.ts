import { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { UnauthorizedError } from '../utils/errors'
import { AuthenticatedRequest } from '../types'
import { getAccessTokenFromCookie } from '../utils/cookies'
import { error } from 'console'

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  let token = getAccessTokenFromCookie(req.cookies || {})

  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (!token) {
    throw new UnauthorizedError('Unauthorized', 'No token provided')
  }

  req.user = verifyToken(token)
  next()
}

// Used ofr public content with personalized features
// Users can see the site without logging in(some features)
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  let token = getAccessTokenFromCookie(req.cookies || {})

  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (token) {
    try {
      req.user = verifyToken(token)
    } catch {
      // Token is invalid but we don't throw - just proceed without user
      console.debug('Optional auth token invalid:', error instanceof Error ? error.message : 'Unknown error') 
    }
  }

  next()
}
