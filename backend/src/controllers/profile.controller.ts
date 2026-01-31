import { Response, NextFunction } from 'express'
import * as profileService from '../services/profile.service'
import { validateUpdateProfile, validateChangePassword } from '../validators/profile.validator'
import { BadRequestError } from '../utils/errors'
import { AuthenticatedRequest, UpdateProfile, ChangePassword } from '../types'
import { clearAuthCookies } from '../utils/cookies'

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const data: UpdateProfile = req.body
    validateUpdateProfile(data)

    const { user, emailChanged, verificationEmailFailed } = await profileService.updateProfile(req.user.userId, data)

    let message = 'Profile updated successfully'
    if (emailChanged) {
      message = verificationEmailFailed
        ? 'Profile updated. Email changed but verification email failed to send. Please use resend verification.'
        : 'Profile updated successfully. Please verify your new email address.'
    }

    res.json({
      message,
      user,
      emailChanged,
      verificationEmailFailed,
    })
  } catch (error) {
    next(error)
  }
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const data: ChangePassword = req.body
    validateChangePassword(data)

    await profileService.changePassword(req.user.userId, data)

    res.json({
      message: 'Password changed successfully. Please log in again on other devices.',
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAvatar(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { avatarUrl } = req.body

    // Avatar URL can be null to remove the avatar
    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
      throw new BadRequestError('Invalid avatar URL', 'Avatar URL must be a string or null')
    }

    const user = await profileService.updateAvatar(req.user.userId, avatarUrl ?? null)

    res.json({
      message: 'Avatar updated successfully',
      user,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    await profileService.deleteAccount(req.user.userId)
    clearAuthCookies(res)

    res.json({
      message: 'Account deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

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

// Menu Items for Restaurant Owners

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
