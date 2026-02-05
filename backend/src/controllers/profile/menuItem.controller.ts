// Menu item controller: getMyMenuItems, createMyMenuItem, updateMyMenuItem, deleteMyMenuItem, getCategories
import { Response, NextFunction } from 'express'
import * as profileService from '../../services/profile'
import { BadRequestError } from '../../utils/errors'
import { AuthenticatedRequest } from '../../types'

export async function getMyMenuItems(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { restaurantId: rawRestaurantId } = req.params
    const restaurantId = Array.isArray(rawRestaurantId) ? rawRestaurantId[0] : rawRestaurantId

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    const items = await profileService.getMyMenuItems(req.user.userId, restaurantId)

    res.json({ items })
  } catch (error) {
    next(error)
  }
}

export async function createMyMenuItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { restaurantId: rawRestaurantId } = req.params
    const restaurantId = Array.isArray(rawRestaurantId) ? rawRestaurantId[0] : rawRestaurantId
    const data = req.body

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    if (!data.name || !data.name.trim()) {
      throw new BadRequestError('Invalid name', 'Menu item name is required')
    }

    if (data.price === undefined || data.price === null) {
      throw new BadRequestError('Invalid price', 'Price is required')
    }

    const price = parseFloat(data.price)
    if (isNaN(price) || price < 0) {
      throw new BadRequestError('Invalid price', 'Price must be a non-negative number')
    }
    data.price = price

    if (data.preparationTime !== undefined && data.preparationTime !== null) {
      const time = parseInt(data.preparationTime, 10)
      if (isNaN(time) || time < 0) {
        throw new BadRequestError('Invalid time', 'Preparation time must be a non-negative integer')
      }
      data.preparationTime = time
    }

    const item = await profileService.createMyMenuItem(req.user.userId, restaurantId, data)

    res.status(201).json({
      message: 'Menu item created successfully',
      item,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateMyMenuItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { restaurantId: rawRestaurantId, itemId: rawItemId } = req.params
    const restaurantId = Array.isArray(rawRestaurantId) ? rawRestaurantId[0] : rawRestaurantId
    const itemId = Array.isArray(rawItemId) ? rawItemId[0] : rawItemId
    const data = req.body

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    if (!itemId) {
      throw new BadRequestError('Invalid ID', 'Menu item ID is required')
    }

    if (data.price !== undefined && data.price !== null) {
      const price = parseFloat(data.price)
      if (isNaN(price) || price < 0) {
        throw new BadRequestError('Invalid price', 'Price must be a non-negative number')
      }
      data.price = price
    }

    if (data.preparationTime !== undefined && data.preparationTime !== null) {
      const time = parseInt(data.preparationTime, 10)
      if (isNaN(time) || time < 0) {
        throw new BadRequestError('Invalid time', 'Preparation time must be a non-negative integer')
      }
      data.preparationTime = time
    }

    const item = await profileService.updateMyMenuItem(req.user.userId, restaurantId, itemId, data)

    res.json({
      message: 'Menu item updated successfully',
      item,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteMyMenuItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { restaurantId: rawRestaurantId, itemId: rawItemId } = req.params
    const restaurantId = Array.isArray(rawRestaurantId) ? rawRestaurantId[0] : rawRestaurantId
    const itemId = Array.isArray(rawItemId) ? rawItemId[0] : rawItemId

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    if (!itemId) {
      throw new BadRequestError('Invalid ID', 'Menu item ID is required')
    }

    await profileService.deleteMyMenuItem(req.user.userId, restaurantId, itemId)

    res.json({
      message: 'Menu item deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function getCategories(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const categories = await profileService.getCategories()

    res.json({ categories })
  } catch (error) {
    next(error)
  }
}
