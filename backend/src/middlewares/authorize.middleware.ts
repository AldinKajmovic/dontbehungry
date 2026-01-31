import { Response, NextFunction } from 'express'
import { UserRole } from '@prisma/client'
import { AuthenticatedRequest } from '../types'
import { ForbiddenError, UnauthorizedError } from '../utils/errors'

type ResourceOwnerCheck = (req: AuthenticatedRequest) => Promise<boolean> | boolean

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const genericError = new ForbiddenError(
      'Access denied',
      'You do not have permission to access this resource'
    )

    if (!req.user || !req.user.role) {
      console.warn('Authorization failed: missing user or role', {
        hasUser: !!req.user,
        hasRole: !!req.user?.role,
        path: req.path,
        method: req.method
      })
      throw genericError
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn('Authorization failed: insufficient permissions', {
        userId: req.user.userId,
        path: req.path,
        method: req.method

      })
      throw genericError
    }

    next()
  }
}                          


export function adminOnly(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'Authentication required')
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenError('Access denied', 'You do not have permission to access this resource')
  }

  next()
}

export function superAdminOnly(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'Authentication required')
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenError('Access denied', 'You do not have permission to access this resource')
  }

  next()
}

export function restaurantOwnerOnly(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'Authentication required')
  }

  const allowedRoles: UserRole[] = [UserRole.RESTAURANT_OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  if (!allowedRoles.includes(req.user.role)) {
    throw new ForbiddenError('Access denied', 'You do not have permission to access this resource')
  }

  next()
}

export function driverOnly(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'Authentication required')
  }

  const allowedRoles: UserRole[] = [UserRole.DELIVERY_DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  if (!allowedRoles.includes(req.user.role)) {
    throw new ForbiddenError('Access denied', 'You do not have permission to access this resource')
  }

  next()
}

export function customerOnly(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'Authentication required')
  }

  const allowedRoles: UserRole[] = [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  if (!allowedRoles.includes(req.user.role)) {
    throw new ForbiddenError('Access denied', 'You do not have permission to access this resource')
  }

  next()
}

export function ownsResource(checkOwnership: ResourceOwnerCheck) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized', 'Authentication required')
    }

    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
      next()
      return
    }

    const isOwner = await checkOwnership(req)
    if (!isOwner) {
      throw new ForbiddenError('Access denied', 'You do not have permission to access this resource')
    }

    next()
  }
}
