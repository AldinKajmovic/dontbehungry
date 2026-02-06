import { Response, NextFunction } from 'express'
import * as locationService from '../../services/profile/location.service'
import { BadRequestError } from '../../utils/errors'
import { AuthenticatedRequest } from '../../types'

export async function updateLocation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { latitude, longitude, heading } = req.body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new BadRequestError('Invalid location', 'Latitude and longitude must be numbers')
    }

    if (latitude < -90 || latitude > 90) {
      throw new BadRequestError('Invalid latitude', 'Latitude must be between -90 and 90')
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestError('Invalid longitude', 'Longitude must be between -180 and 180')
    }

    if (heading !== undefined && heading !== null) {
      if (typeof heading !== 'number' || heading < 0 || heading > 360) {
        throw new BadRequestError('Invalid heading', 'Heading must be a number between 0 and 360')
      }
    }

    await locationService.updateDriverLocation(req.user.userId, {
      latitude,
      longitude,
      heading: heading ?? undefined,
    })

    res.json({ message: 'Location updated' })
  } catch (error) {
    next(error)
  }
}

export async function getDriverLocation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const orderId = req.params.orderId as string

    if (!orderId) {
      throw new BadRequestError('Missing order ID', 'Order ID is required')
    }

    const location = await locationService.getDriverLocationForOrder(
      orderId,
      req.user.userId
    )

    if (!location) {
      res.json({ location: null })
      return
    }

    res.json({ location })
  } catch (error) {
    next(error)
  }
}
