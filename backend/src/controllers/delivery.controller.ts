// Delivery calculation controller
import { Request, Response, NextFunction } from 'express'
import { getDeliveryInfoWithFallback } from '../services/delivery.service'
import { BadRequestError } from '../utils/errors'

interface DeliveryInfoQuery {
  restaurantId?: string
  addressId?: string
}

export async function getDeliveryInfo(
  req: Request<object, object, object, DeliveryInfoQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { restaurantId, addressId } = req.query

    if (!restaurantId || !addressId) {
      throw new BadRequestError(
        'Missing parameters',
        'restaurantId and addressId are required'
      )
    }

    const result = await getDeliveryInfoWithFallback(restaurantId, addressId)

    if (result.usedFallback) {
      res.json({
        success: false,
        fallbackFee: result.fallbackFee,
        message: 'Could not calculate exact delivery info, using default fee',
      })
    } else {
      res.json({
        success: true,
        deliveryInfo: result.deliveryInfo,
      })
    }
  } catch (error) {
    next(error)
  }
}
