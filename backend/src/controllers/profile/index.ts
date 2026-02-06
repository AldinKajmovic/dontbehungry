// Barrel exports for profile controllers

// User profile controllers
export {
  updateProfile,
  changePassword,
  updateAvatar,
  deleteAccount,
} from './user.controller'

// Restaurant owner controllers
export {
  getMyRestaurants,
  createMyRestaurant,
  updateMyRestaurant,
  deleteMyRestaurant,
} from './restaurant.controller'

// Menu item controllers
export {
  getMyMenuItems,
  createMyMenuItem,
  updateMyMenuItem,
  deleteMyMenuItem,
  getCategories,
} from './menuItem.controller'

// Order controllers
export {
  createOrder,
  getMyOrderHistory,
  getDriverOrderHistory,
  getRestaurantOrders,
  updateRestaurantOrderStatus,
} from './order.controller'

// Availability controllers
export {
  toggleAvailability,
  getAvailabilityStatus,
  getMonthlyHours,
} from './availability.controller'

// Location controllers
export {
  updateLocation,
  getDriverLocation,
} from './location.controller'

// Order assignment controllers
export {
  acceptOrderHandler,
  denyOrderHandler,
  getAvailableOrdersHandler,
} from './orderAssignment.controller'
