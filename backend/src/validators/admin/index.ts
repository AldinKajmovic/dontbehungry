// Barrel exports for admin validators

// Shared utilities and types
export {
  EMAIL_REGEX,
  VALID_LIMITS,
  MAX_STRING_LENGTHS,
  validateStringLength,
  validatePagination,
  type PaginationParams,
} from './shared'

// User validators
export {
  validateUserFilters,
  validateCreateUser,
  validateUpdateUser,
  type UserFilters,
  type CreateUserData,
  type UpdateUserData,
} from './users.validator'

// Restaurant validators
export {
  validateRestaurantFilters,
  validateCreateRestaurant,
  validateUpdateRestaurant,
  type RestaurantFilters,
  type CreateRestaurantData,
  type UpdateRestaurantData,
} from './restaurants.validator'

// Order validators
export {
  validateOrderFilters,
  validateCreateOrder,
  validateUpdateOrder,
  validateCreateOrderItem,
  validateUpdateOrderItem,
  validateUpdatePayment,
  type OrderFilters,
  type CreateOrderData,
  type UpdateOrderData,
  type CreateOrderItemData,
  type UpdateOrderItemData,
  type UpdatePaymentData,
} from './orders.validator'

// Menu item validators
export {
  validateMenuItemFilters,
  validateCreateMenuItem,
  validateUpdateMenuItem,
  type MenuItemFilters,
  type CreateMenuItemData,
  type UpdateMenuItemData,
} from './menuItems.validator'

// Category validators
export {
  validateCreateCategory,
  type CreateCategoryData,
  type UpdateCategoryData,
} from './categories.validator'

// Place validators
export {
  validatePlaceFilters,
  validateCreatePlace,
  type PlaceFilters,
  type CreatePlaceData,
  type UpdatePlaceData,
} from './places.validator'

// Review validators
export {
  validateReviewFilters,
  validateCreateReview,
  validateUpdateReview,
  type ReviewFilters,
  type CreateReviewData,
  type UpdateReviewData,
} from './reviews.validator'
