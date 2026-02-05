// Order controller: createOrder, getMyOrderHistory, getDriverOrderHistory, getRestaurantOrders, updateRestaurantOrderStatus
import { Response, NextFunction } from 'express'
import * as profileService from '../../services/profile'
import { BadRequestError } from '../../utils/errors'
import { AuthenticatedRequest } from '../../types'
import { OrderHistoryFilters } from '../../services/profile'

const VALID_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]

const VALID_PAYMENT_METHODS = ['CASH', 'CREDIT_CARD', 'DIGITAL_WALLET']

export async function createOrder(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { restaurantId, deliveryAddressId, paymentMethod, notes, items } = req.body

    if (!restaurantId || typeof restaurantId !== 'string') {
      throw new BadRequestError('Invalid restaurant', 'Restaurant ID is required')
    }

    if (!deliveryAddressId || typeof deliveryAddressId !== 'string') {
      throw new BadRequestError('Invalid address', 'Delivery address ID is required')
    }

    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new BadRequestError(
        'Invalid payment method',
        `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Invalid items', 'Order must contain at least one item')
    }

    for (const item of items) {
      if (!item.menuItemId || typeof item.menuItemId !== 'string') {
        throw new BadRequestError('Invalid item', 'Each item must have a valid menu item ID')
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        throw new BadRequestError('Invalid quantity', 'Each item must have a quantity of at least 1')
      }
    }

    const order = await profileService.createOrder(req.user.userId, {
      restaurantId,
      deliveryAddressId,
      paymentMethod,
      notes: notes?.trim() || undefined,
      items: items.map((item: { menuItemId: string; quantity: number; notes?: string }) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes?.trim() || undefined,
      })),
    })

    res.status(201).json({
      message: 'Order placed successfully',
      order,
    })
  } catch (error) {
    next(error)
  }
}

function parseOrderHistoryFilters(query: Record<string, unknown>): OrderHistoryFilters {
  const { status, createdAtFrom, createdAtTo, page, limit } = query

  const filters: OrderHistoryFilters = {}

  if (status) {
    const statusStr = (status as string).toUpperCase()
    if (!VALID_ORDER_STATUSES.includes(statusStr)) {
      throw new BadRequestError('Invalid status', `status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`)
    }
    filters.status = statusStr
  }

  if (createdAtFrom) {
    const fromDate = new Date(createdAtFrom as string)
    if (isNaN(fromDate.getTime())) {
      throw new BadRequestError('Invalid date', 'createdAtFrom must be a valid date')
    }
    filters.createdAtFrom = fromDate
  }

  if (createdAtTo) {
    const toDate = new Date(createdAtTo as string)
    if (isNaN(toDate.getTime())) {
      throw new BadRequestError('Invalid date', 'createdAtTo must be a valid date')
    }
    // Set to end of day
    toDate.setHours(23, 59, 59, 999)
    filters.createdAtTo = toDate
  }

  if (page) {
    const pageNum = parseInt(page as string, 10)
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestError('Invalid page', 'page must be a positive integer')
    }
    filters.page = pageNum
  }

  if (limit) {
    const limitNum = parseInt(limit as string, 10)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestError('Invalid limit', 'limit must be between 1 and 100')
    }
    filters.limit = limitNum
  }

  return filters
}

export async function getMyOrderHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const filters = parseOrderHistoryFilters(req.query as Record<string, unknown>)
    const result = await profileService.getMyOrderHistory(req.user.userId, filters)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getDriverOrderHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    if (req.user.role !== 'DELIVERY_DRIVER') {
      throw new BadRequestError('Forbidden', 'Only delivery drivers can access this endpoint')
    }

    const filters = parseOrderHistoryFilters(req.query as Record<string, unknown>)
    const result = await profileService.getDriverOrderHistory(req.user.userId, filters)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateRestaurantOrderStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    if (req.user.role !== 'RESTAURANT_OWNER') {
      throw new BadRequestError('Forbidden', 'Only restaurant owners can access this endpoint')
    }

    const { restaurantId: rawRestaurantId, orderId: rawOrderId } = req.params
    const restaurantId = Array.isArray(rawRestaurantId) ? rawRestaurantId[0] : rawRestaurantId
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    if (!orderId) {
      throw new BadRequestError('Invalid ID', 'Order ID is required')
    }

    const { status, notes } = req.body

    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      throw new BadRequestError(
        'Invalid status',
        `Status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`
      )
    }

    const updated = await profileService.updateRestaurantOrderStatus(
      req.user.userId,
      restaurantId,
      orderId,
      { status, notes }
    )

    res.json({
      message: 'Order status updated successfully',
      order: updated,
    })
  } catch (error) {
    next(error)
  }
}

export async function getRestaurantOrders(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    if (req.user.role !== 'RESTAURANT_OWNER') {
      throw new BadRequestError('Forbidden', 'Only restaurant owners can access this endpoint')
    }

    const { restaurantId: rawRestaurantId } = req.params
    const restaurantId = Array.isArray(rawRestaurantId) ? rawRestaurantId[0] : rawRestaurantId

    if (!restaurantId) {
      throw new BadRequestError('Invalid ID', 'Restaurant ID is required')
    }

    const filters = parseOrderHistoryFilters(req.query as Record<string, unknown>)
    const result = await profileService.getRestaurantOrders(req.user.userId, restaurantId, filters)

    res.json(result)
  } catch (error) {
    next(error)
  }
}
