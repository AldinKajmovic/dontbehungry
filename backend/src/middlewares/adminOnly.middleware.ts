import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { ForbiddenError, UnauthorizedError } from '../utils/errors'

export function adminOnly(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'Authentication required')
  }

  const allowedRoles = ['ADMIN', 'SUPER_ADMIN']

  if (!allowedRoles.includes(req.user.role)) {
    throw new ForbiddenError(
      'Access denied',
      'You do not have permission to access the admin panel'
    )
  }

  next()
}
