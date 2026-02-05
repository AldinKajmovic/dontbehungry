// Barrel exports for profile services

// Types
export * from './types'

// User services
export {
  updateProfile,
  changePassword,
  updateAvatar,
  deleteAccount,
} from './user.service'

// Restaurant services
export {
  getMyRestaurants,
  createMyRestaurant,
  updateMyRestaurant,
  deleteMyRestaurant,
  verifyRestaurantOwnership,
} from './restaurant.service'

// Menu item services
export {
  getMyMenuItems,
  createMyMenuItem,
  updateMyMenuItem,
  deleteMyMenuItem,
  getCategories,
} from './menuItem.service'

// Order services
export { createOrder } from './order.service'

// Order history services
export {
  getMyOrderHistory,
  getDriverOrderHistory,
  getRestaurantOrders,
  updateRestaurantOrderStatus,
} from './orderHistory.service'

// Availability services
export {
  toggleAvailability,
  getAvailabilityStatus,
  getMonthlyHours,
  closeStaleShifts,
} from './availability.service'
export type { AvailabilityStatus, MonthlyHours, MonthlyHoursResponse } from './availability.service'
