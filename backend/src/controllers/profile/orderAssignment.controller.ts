import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../types'
import { BadRequestError, ForbiddenError } from '../../utils/errors'
import {
  acceptOrder,
  denyOrder,
  getAvailableOrdersForDriver,
} from '../../services/profile/orderBroadcast.service'

function requireDriver(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new BadRequestError('Unauthorized', 'User not authenticated')
  }
  if (req.user.role !== 'DELIVERY_DRIVER') {
    throw new ForbiddenError('Forbidden', 'Only delivery drivers can access this endpoint')
  }
  return req.user.userId
}

export async function acceptOrderHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = requireDriver(req)
    const { orderId } = req.params

    if (!orderId || typeof orderId !== 'string') {
      throw new BadRequestError('Invalid order ID', 'Order ID is required')
    }

    const result = await acceptOrder(orderId, driverId)

    if (!result.success) {
      res.status(409).json(result)
      return
    }

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function denyOrderHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = requireDriver(req)
    const { orderId } = req.params

    if (!orderId || typeof orderId !== 'string') {
      throw new BadRequestError('Invalid order ID', 'Order ID is required')
    }

    await denyOrder(orderId, driverId)
    res.json({ message: 'Order denied' })
  } catch (error) {
    next(error)
  }
}

export async function getAvailableOrdersHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = requireDriver(req)
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(25, Math.max(1, parseInt(req.query.limit as string) || 10))
    const result = await getAvailableOrdersForDriver(driverId, page, limit)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
