// Admin-specific types

// Filter types
export interface UserFilters {
  role?: string
  emailVerified?: string
  [key: string]: string | undefined
}

export interface RestaurantFilters {
  ownerId?: string
  minRating?: string
  maxRating?: string
  minDeliveryFee?: string
  maxDeliveryFee?: string
  minOrderAmount?: string
  maxOrderAmount?: string
  [key: string]: string | undefined
}

export interface OrderFilters {
  status?: string
  paymentStatus?: string
  restaurantId?: string
  customerId?: string
  driverId?: string
  minTotalAmount?: string
  maxTotalAmount?: string
  createdAtFrom?: string
  createdAtTo?: string
  [key: string]: string | undefined
}

export interface MenuItemFilters {
  restaurantId?: string
  categoryId?: string
  isAvailable?: string
  minPrice?: string
  maxPrice?: string
  minPrepTime?: string
  maxPrepTime?: string
  [key: string]: string | undefined
}

export interface ReviewFilters {
  rating?: string
  restaurantId?: string
  [key: string]: string | undefined
}

export interface PlaceFilters {
  city?: string
  state?: string
  country?: string
  [key: string]: string | undefined
}

// Sorting
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AdminStats {
  totalUsers: number
  totalRestaurants: number
  totalOrders: number
  totalRevenue: number
}

// User types
export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  avatarUrl: string | null
  authProvider?: string
}

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  password: string
  phone: string
  role?: string
}

export type UpdateUserInput = Partial<Omit<AdminUser, 'id'>>

// User Address types
export interface UserAddress {
  id: string
  address: string
  city: string
  state: string | null
  country: string
  postalCode: string | null
  notes: string | null
  isDefault: boolean
  latitude: number | null
  longitude: number | null
}

export interface CreateUserAddressInput {
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  notes?: string
  isDefault?: boolean
  latitude?: number
  longitude?: number
}

export type UpdateUserAddressInput = Partial<CreateUserAddressInput>

// Restaurant types
export interface AdminRestaurant {
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
  owner: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  place: AdminPlace
}

export interface CreateRestaurantInput {
  name: string
  description?: string
  phone?: string
  email?: string
  ownerId: string
  placeId: string
  minOrderAmount?: number
  deliveryFee?: number
  logoUrl?: string | null
  coverUrl?: string | null
}

export interface UpdateRestaurantInput {
  name?: string
  description?: string | null
  phone?: string | null
  email?: string | null
  ownerId?: string
  placeId?: string
  minOrderAmount?: number | null
  deliveryFee?: number | null
  logoUrl?: string | null
  coverUrl?: string | null
}

// Category types
export interface AdminCategory {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
}

export type CreateCategoryInput = Partial<AdminCategory>
export type UpdateCategoryInput = Partial<AdminCategory>

// Menu Item types
export interface AdminMenuItem {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  preparationTime: number | null
  restaurant: {
    id: string
    name: string
  }
  category: {
    id: string
    name: string
  } | null
}

export interface CreateMenuItemInput {
  name: string
  description?: string
  price: number
  imageUrl?: string
  restaurantId: string
  categoryId?: string
  isAvailable?: boolean
  preparationTime?: number
}

export interface UpdateMenuItemInput {
  name?: string
  description?: string | null
  price?: number
  imageUrl?: string | null
  restaurantId?: string
  categoryId?: string | null
  isAvailable?: boolean
  preparationTime?: number | null
}

export interface AdminOrderItem {
  id: string
  orderId: string
  menuItemId: string
  quantity: number
  unitPrice: string
  totalPrice: string
  notes: string | null
  menuItem: {
    id: string
    name: string
    price: string
  }
}

export interface CreateOrderItemInput {
  menuItemId: string
  quantity: number
  notes?: string | null
}

export interface UpdateOrderItemInput {
  quantity?: number
  notes?: string | null
}

// Order types
export interface AdminOrder {
  id: string
  status: string
  subtotal: string
  deliveryFee: string
  tax: string
  totalAmount: string
  notes: string | null
  estimatedDelivery: string | null
  deliveredAt: string | null
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  restaurant: {
    id: string
    name: string
  }
  deliveryPlace: AdminPlace
  driver: {
    id: string
    email: string
    firstName: string
    lastName: string
  } | null
  payment: AdminPayment | null
  orderItems?: AdminOrderItem[]
}

export interface CreateOrderInput {
  userId: string
  restaurantId: string
  deliveryPlaceId: string
  driverId?: string | null
  status?: string
  subtotal: number
  deliveryFee?: number
  tax?: number
  notes?: string | null
}

export interface UpdateOrderInput {
  status?: string
  driverId?: string | null
  notes?: string
}

// Review types
export interface AdminReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  restaurant: {
    id: string
    name: string
  }
}

export interface CreateReviewInput {
  userId: string
  restaurantId: string
  rating: number
  title?: string
  content?: string
}

export interface UpdateReviewInput {
  rating?: number
  title?: string | null
  content?: string | null
}

// Place types
export interface AdminPlace {
  id: string
  address: string
  city: string
  state: string | null
  country: string
  postalCode: string | null
  latitude: number | null
  longitude: number | null
}

export type CreatePlaceInput = Partial<AdminPlace>
export type UpdatePlaceInput = Partial<AdminPlace>

// Payment types
export interface AdminPayment {
  id: string
  amount: string
  method: string
  status: string
  order?: {
    id: string
    user: {
      id: string
      email: string
    }
    restaurant: {
      id: string
      name: string
    }
  }
}

export type UpdatePaymentInput = Partial<AdminPayment>
