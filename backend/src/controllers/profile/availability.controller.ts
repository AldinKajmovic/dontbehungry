import { Response, NextFunction } from 'express'
import * as availabilityService from '../../services/profile/availability.service'
import { BadRequestError } from '../../utils/errors'
import { AuthenticatedRequest } from '../../types'

export async function toggleAvailability(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const result = await availabilityService.toggleAvailability(req.user.userId)

    res.json({
      message: result.isOnline ? 'You are now online' : 'You are now offline',
      ...result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getAvailabilityStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const result = await availabilityService.getAvailabilityStatus(req.user.userId)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getMonthlyHours(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    let months = 6
    if (req.query.months) {
      const parsedMonths = parseInt(req.query.months as string, 10)
      if (isNaN(parsedMonths) || parsedMonths < 1 || parsedMonths > 12) {
        throw new BadRequestError('Invalid months', 'Months must be between 1 and 12')
      }
      months = parsedMonths
    }

    const result = await availabilityService.getMonthlyHours(req.user.userId, months)

    res.json(result)
  } catch (error) {
    next(error)
  }
}
