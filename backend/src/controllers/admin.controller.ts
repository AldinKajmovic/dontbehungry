import { Request, Response, NextFunction } from 'express'
import * as adminService from '../services/admin'
import {
  validatePagination,
  validateUserFilters,
  validateRestaurantFilters,
  validateOrderFilters,
  validateMenuItemFilters,
  validateReviewFilters,
  validatePlaceFilters,
  validateCreateUser,
  validateUpdateUser,
  validateCreateRestaurant,
  validateUpdateRestaurant,
  validateCreateCategory,
  validateCreateMenuItem,
  validateUpdateMenuItem,
  validateCreateOrder,
  validateUpdateOrder,
  validateCreateOrderItem,
  validateUpdateOrderItem,
  validateCreateReview,
  validateUpdateReview,
  validateCreatePlace,
  validateUpdatePayment,
} from '../validators/admin'

// Type for routes with ID parameter
type IdParams = { id: string }

export async function verifyAccess(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({ message: 'Access verified', authorized: true })
  } catch (error) {
    next(error)
  }
}

export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await adminService.getStats()
    res.json(stats)
  } catch (error) {
    next(error)
  }
}

// ==================== USERS ====================

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const filters = validateUserFilters(req.query as Record<string, string>)
    const result = await adminService.getUsers(params, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getUserById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await adminService.getUserById(req.params.id)
    res.json(user)
  } catch (error) {
    next(error)
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreateUser(req.body)
    const user = await adminService.createUser(req.body)
    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}

export async function updateUser(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateUpdateUser(req.body)
    const user = await adminService.updateUser(req.params.id, req.body)
    res.json(user)
  } catch (error) {
    next(error)
  }
}

export async function deleteUser(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteUser(req.params.id)
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== USER ADDRESSES ====================

type UserAddressParams = { userId: string; addressId?: string }

export async function getUserAddresses(
  req: Request<UserAddressParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const addresses = await adminService.getUserAddresses(req.params.userId)
    res.json(addresses)
  } catch (error) {
    next(error)
  }
}

export async function addUserAddress(
  req: Request<UserAddressParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const address = await adminService.addUserAddress(req.params.userId, req.body)
    res.status(201).json(address)
  } catch (error) {
    next(error)
  }
}

export async function updateUserAddress(
  req: Request<UserAddressParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const address = await adminService.updateUserAddress(
      req.params.userId,
      req.params.addressId!,
      req.body
    )
    res.json(address)
  } catch (error) {
    next(error)
  }
}

export async function deleteUserAddress(
  req: Request<UserAddressParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteUserAddress(req.params.userId, req.params.addressId!)
    res.json({ message: 'Address deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== RESTAURANTS ====================

export async function getRestaurants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const filters = validateRestaurantFilters(req.query as Record<string, string>)
    const result = await adminService.getRestaurants(params, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getRestaurantById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const restaurant = await adminService.getRestaurantById(req.params.id)
    res.json(restaurant)
  } catch (error) {
    next(error)
  }
}

export async function createRestaurant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreateRestaurant(req.body)
    const restaurant = await adminService.createRestaurant(req.body)
    res.status(201).json(restaurant)
  } catch (error) {
    next(error)
  }
}

export async function updateRestaurant(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateUpdateRestaurant(req.body)
    const restaurant = await adminService.updateRestaurant(req.params.id, req.body)
    res.json(restaurant)
  } catch (error) {
    next(error)
  }
}

export async function deleteRestaurant(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteRestaurant(req.params.id)
    res.json({ message: 'Restaurant deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== CATEGORIES ====================

export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const result = await adminService.getCategories(params)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getCategoryById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = await adminService.getCategoryById(req.params.id)
    res.json(category)
  } catch (error) {
    next(error)
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreateCategory(req.body)
    const category = await adminService.createCategory(req.body)
    res.status(201).json(category)
  } catch (error) {
    next(error)
  }
}

export async function updateCategory(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = await adminService.updateCategory(req.params.id, req.body)
    res.json(category)
  } catch (error) {
    next(error)
  }
}

export async function deleteCategory(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteCategory(req.params.id)
    res.json({ message: 'Category deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== MENU ITEMS ====================

export async function getMenuItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const filters = validateMenuItemFilters(req.query as Record<string, string>)
    const result = await adminService.getMenuItems(params, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getMenuItemById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await adminService.getMenuItemById(req.params.id)
    res.json(item)
  } catch (error) {
    next(error)
  }
}

export async function createMenuItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreateMenuItem(req.body)
    const item = await adminService.createMenuItem(req.body)
    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
}

export async function updateMenuItem(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateUpdateMenuItem(req.body)
    const item = await adminService.updateMenuItem(req.params.id, req.body)
    res.json(item)
  } catch (error) {
    next(error)
  }
}

export async function deleteMenuItem(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteMenuItem(req.params.id)
    res.json({ message: 'Menu item deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== ORDERS ====================

export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const filters = validateOrderFilters(req.query as Record<string, string>)
    const result = await adminService.getOrders(params, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getOrderById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const order = await adminService.getOrderById(req.params.id)
    res.json(order)
  } catch (error) {
    next(error)
  }
}

export async function updateOrder(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateUpdateOrder(req.body)
    const order = await adminService.updateOrder(req.params.id, req.body)
    res.json(order)
  } catch (error) {
    next(error)
  }
}

export async function deleteOrder(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteOrder(req.params.id)
    res.json({ message: 'Order deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreateOrder(req.body)
    const order = await adminService.createOrder(req.body)
    res.status(201).json(order)
  } catch (error) {
    next(error)
  }
}

// ==================== ORDER ITEMS ====================

interface OrderItemParams {
  orderId: string
  itemId?: string
}

export async function getOrderItems(
  req: Request<{ orderId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const items = await adminService.getOrderItems(req.params.orderId)
    res.json(items)
  } catch (error) {
    next(error)
  }
}

export async function addOrderItem(
  req: Request<{ orderId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreateOrderItem(req.body)
    const item = await adminService.addOrderItem(req.params.orderId, req.body)
    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
}

export async function updateOrderItem(
  req: Request<OrderItemParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateUpdateOrderItem(req.body)
    const item = await adminService.updateOrderItem(req.params.itemId!, req.body)
    res.json(item)
  } catch (error) {
    next(error)
  }
}

export async function deleteOrderItem(
  req: Request<OrderItemParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteOrderItem(req.params.itemId!)
    res.json({ message: 'Order item deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== REVIEWS ====================

export async function getReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const filters = validateReviewFilters(req.query as Record<string, string>)
    const result = await adminService.getReviews(params, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getReviewById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const review = await adminService.getReviewById(req.params.id)
    res.json(review)
  } catch (error) {
    next(error)
  }
}

export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreateReview(req.body)
    const review = await adminService.createReview(req.body)
    res.status(201).json(review)
  } catch (error) {
    next(error)
  }
}

export async function updateReview(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateUpdateReview(req.body)
    const review = await adminService.updateReview(req.params.id, req.body)
    res.json(review)
  } catch (error) {
    next(error)
  }
}

export async function deleteReview(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deleteReview(req.params.id)
    res.json({ message: 'Review deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== PLACES ====================

export async function getPlaces(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const filters = validatePlaceFilters(req.query as Record<string, string>)
    const result = await adminService.getPlaces(params, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getPlaceById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const place = await adminService.getPlaceById(req.params.id)
    res.json(place)
  } catch (error) {
    next(error)
  }
}

export async function createPlace(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateCreatePlace(req.body)
    const place = await adminService.createPlace(req.body)
    res.status(201).json(place)
  } catch (error) {
    next(error)
  }
}

export async function updatePlace(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const place = await adminService.updatePlace(req.params.id, req.body)
    res.json(place)
  } catch (error) {
    next(error)
  }
}

export async function deletePlace(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.deletePlace(req.params.id)
    res.json({ message: 'Place deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ==================== PAYMENTS ====================

export async function getPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = validatePagination(req.query as Record<string, string>)
    const result = await adminService.getPayments(params)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getPaymentById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payment = await adminService.getPaymentById(req.params.id)
    res.json(payment)
  } catch (error) {
    next(error)
  }
}

export async function updatePayment(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateUpdatePayment(req.body)
    const payment = await adminService.updatePayment(req.params.id, req.body)
    res.json(payment)
  } catch (error) {
    next(error)
  }
}

// ==================== DRIVERS ====================

export async function getOnlineDrivers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await adminService.getOnlineDriversWithLocations()
    res.json(result)
  } catch (error) {
    next(error)
  }
}
