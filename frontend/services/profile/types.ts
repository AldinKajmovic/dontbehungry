// Profile-specific types
import { User, AuthResponse } from '../auth/types'

// Re-export for convenience
export type { User, AuthResponse }

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

export interface UpdateProfileResponse {
  message: string
  user: User
  emailChanged?: boolean
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface UpdateAvatarData {
  avatarUrl: string | null
}

// Restaurant owner types
export interface MyRestaurant {
  id: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: string
  minOrderAmount: string | null
  deliveryFee: string | null
  place: {
    id: string
    address: string
    city: string
    country: string
  }
}

export interface CreateMyRestaurantData {
  name: string
  description?: string | null
  phone?: string | null
  email?: string | null
  address: string
  city: string
  country: string
  postalCode?: string | null
  minOrderAmount?: number | null
  deliveryFee?: number | null
}

export interface UpdateMyRestaurantData {
  name?: string
  description?: string | null
  phone?: string | null
  email?: string | null
  minOrderAmount?: number | null
  deliveryFee?: number | null
  logoUrl?: string | null
  coverUrl?: string | null
}

// Menu item types for restaurant owners
export interface MyMenuItem {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  preparationTime: number | null
  category: { id: string; name: string } | null
}

export interface CreateMyMenuItemData {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  categoryId?: string | null
  isAvailable?: boolean
  preparationTime?: number | null
}

export interface UpdateMyMenuItemData {
  name?: string
  description?: string | null
  price?: number
  imageUrl?: string | null
  categoryId?: string | null
  isAvailable?: boolean
  preparationTime?: number | null
}

export interface Category {
  id: string
  name: string
}

// Order History Types

export interface OrderHistoryFilters {
  createdAtFrom?: string
  createdAtTo?: string
  status?: string
  page?: number
  limit?: number
}

export interface OrderHistoryItem {
  id: string
  status: string
  totalAmount: string
  createdAt: string
  deliveredAt: string | null
  restaurant: { id: string; name: string }
  deliveryPlace: { address: string; city: string; latitude: number | null; longitude: number | null }
  orderItems: Array<{ name: string; quantity: number; unitPrice: string }>
  payment: { status: string; method: string } | null
  customerFirstName?: string // Only for driver orders
}

export interface OrderHistoryResponse {
  orders: OrderHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Restaurant Orders (for restaurant owners)

export interface RestaurantOrderItem extends OrderHistoryItem {
  customerName: string
  customerPhone: string | null
}

export interface RestaurantOrdersResponse {
  orders: RestaurantOrderItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Order Status Update Types
export interface UpdateOrderStatusData {
  status: string
  notes?: string
}

export interface UpdateOrderStatusResponse {
  message: string
  order: {
    id: string
    status: string
  }
}

// Order Creation Types

export interface CreateOrderData {
  restaurantId: string
  deliveryAddressId: string
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DIGITAL_WALLET'
  notes?: string
  items: Array<{
    menuItemId: string
    quantity: number
    notes?: string
  }>
}

export interface CreatedOrder {
  id: string
  status: string
  totalAmount: string
  createdAt: string
  restaurant: { id: string; name: string }
  deliveryPlace: { address: string; city: string }
  orderItems: Array<{ name: string; quantity: number; unitPrice: string }>
  payment: { status: string; method: string }
}

export interface CreateOrderResponse {
  message: string
  order: CreatedOrder
}

export interface DeliveryInfo {
  distanceKm: number
  distanceText: string
  durationMinutes: number
  durationText: string
  baseFee: number
  weatherSurcharge: number
  totalFee: number
  weatherCondition: string | null
  isWeatherBad: boolean
  estimatedDeliveryTime: string
  note: string
}

export interface DeliveryInfoResponse {
  success: true
  deliveryInfo: DeliveryInfo
}

export interface DeliveryInfoFallbackResponse {
  success: false
  fallbackFee: number
  message: string
}

export type GetDeliveryInfoResponse = DeliveryInfoResponse | DeliveryInfoFallbackResponse

// Driver Availability Types

export interface AvailabilityStatus {
  isOnline: boolean
  currentShift: {
    id: string
    startTime: string
    elapsedMinutes: number
    firstOrderTime: string | null
    workedMinutes: number
  } | null
}

export interface ToggleAvailabilityResponse extends AvailabilityStatus {
  message: string
}

export interface MonthlyHours {
  month: string // YYYY-MM format
  year: number
  monthNumber: number
  monthName: string
  totalMinutes: number
  totalHours: number
  shiftCount: number
}

export interface MonthlyHoursResponse {
  months: MonthlyHours[]
  totalMinutes: number
  totalHours: number
}

// Driver Location Types

export interface DriverLocationResponse {
  driverId: string
  driverName: string
  latitude: number
  longitude: number
  heading: number | null
  updatedAt: string
  isStale: boolean
}

export interface GetDriverLocationResponse {
  location: DriverLocationResponse | null
}

export interface UpdateLocationData {
  latitude: number
  longitude: number
  heading?: number
}

export interface LocationUpdateEvent {
  orderId: string
  driverId: string
  driverName: string
  location: {
    latitude: number
    longitude: number
    heading: number | null
  }
  timestamp: string
}
