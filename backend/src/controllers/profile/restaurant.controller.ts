// Restaurant owner controller: getMyRestaurants, createMyRestaurant, updateMyRestaurant, deleteMyRestaurant
import { Response, NextFunction } from 'express'
import * as profileService from '../../services/profile'
import { BadRequestError } from '../../utils/errors'
import { AuthenticatedRequest } from '../../types'

export async function getMyRestaurants(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const restaurants = await profileService.getMyRestaurants(req.user.userId)

    res.json({
      restaurants,
    })
  } catch (error) {
    next(error)
  }
}

export async function createMyRestaurant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const data = req.body

    if (!data.name || !data.name.trim()) {
      throw new BadRequestError('Invalid name', 'Restaurant name is required')
    }
    if (!data.address || !data.address.trim()) {
      throw new BadRequestError('Invalid address', 'Address is required')
    }
    if (!data.city || !data.city.trim()) {
      throw new BadRequestError('Invalid city', 'City is required')
    }
    if (!data.country || !data.country.trim()) {
      throw new BadRequestError('Invalid country', 'Country is required')
    }

    if (data.minOrderAmount !== undefined && data.minOrderAmount !== null) {
      const amount = parseFloat(data.minOrderAmount)
      if (isNaN(amount) || amount < 0) {
        throw new BadRequestError('Invalid amount', 'Min order amount must be a positive number')
      }
      data.minOrderAmount = amount
    }

    if (data.deliveryFee !== undefined && data.deliveryFee !== null) {
      const fee = parseFloat(data.deliveryFee)
      if (isNaN(fee) || fee < 0) {
        throw new BadRequestError('Invalid amount', 'Delivery fee must be a positive number')
      }
      data.deliveryFee = fee
    }

    const restaurant = await profileService.createMyRestaurant(req.user.userId, data)

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateMyRestaurant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { id } = req.params
    const data = req.body
    const restaurantId = Array.isArray(id) ? id[0] : id

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    // Basic validation
    if (data.minOrderAmount !== undefined && data.minOrderAmount !== null) {
      const amount = parseFloat(data.minOrderAmount)
      if (isNaN(amount) || amount < 0) {
        throw new BadRequestError('Invalid amount', 'Min order amount must be a positive number')
      }
      data.minOrderAmount = amount
    }

    if (data.deliveryFee !== undefined && data.deliveryFee !== null) {
      const fee = parseFloat(data.deliveryFee)
      if (isNaN(fee) || fee < 0) {
        throw new BadRequestError('Invalid amount', 'Delivery fee must be a positive number')
      }
      data.deliveryFee = fee
    }

    const restaurant = await profileService.updateMyRestaurant(req.user.userId, restaurantId, data)

    res.json({
      message: 'Restaurant updated successfully',
      restaurant,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteMyRestaurant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { id } = req.params
    const restaurantId = Array.isArray(id) ? id[0] : id

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    await profileService.deleteMyRestaurant(req.user.userId, restaurantId)

    res.json({
      message: 'Restaurant deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
